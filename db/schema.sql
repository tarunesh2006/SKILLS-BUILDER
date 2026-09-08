-- ============================================================================
--  Student Programming Learning Platform — relational schema (MySQL 8.0)
--  Single DB for: users, tracks, modules, lessons, progress,
--                 tests, test_items, test_cases, test_access, submissions
-- ============================================================================

CREATE DATABASE IF NOT EXISTS learning_platform
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE learning_platform;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS submission_results;
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS test_access;
DROP TABLE IF EXISTS test_cases;
DROP TABLE IF EXISTS test_item_options;
DROP TABLE IF EXISTS test_items;
DROP TABLE IF EXISTS tests;
DROP TABLE IF EXISTS progress;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS modules;
DROP TABLE IF EXISTS tracks;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
--  Access layer
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  role          ENUM('student','admin') NOT NULL,
  -- students authenticate with roll_number; admins with username
  roll_number   VARCHAR(32)  NULL UNIQUE,
  username      VARCHAR(64)  NULL UNIQUE,
  full_name     VARCHAR(120) NOT NULL,
  email         VARCHAR(190) NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_identity CHECK (
    (role = 'student' AND roll_number IS NOT NULL) OR
    (role = 'admin'   AND username    IS NOT NULL)
  )
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
--  Course delivery
-- ----------------------------------------------------------------------------
CREATE TABLE tracks (
  id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  slug         VARCHAR(40)  NOT NULL UNIQUE,   -- 'c','cpp','java','python','mysql','mongodb','react','networking'
  title        VARCHAR(120) NOT NULL,
  description  TEXT NULL,
  -- coding tracks are auto-graded by the judge; non-coding tracks use MCQ/short-answer
  kind         ENUM('coding','non_coding') NOT NULL,
  -- Piston language id for coding tracks (e.g. 'c','c++','java','python'); NULL otherwise
  judge_language VARCHAR(40) NULL,
  sort_order   INT NOT NULL DEFAULT 0,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE modules (
  id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  track_id     BIGINT UNSIGNED NOT NULL,
  title        VARCHAR(160) NOT NULL,
  summary      TEXT NULL,
  sort_order   INT NOT NULL DEFAULT 0,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
  INDEX idx_modules_track (track_id, sort_order)
) ENGINE=InnoDB;

CREATE TABLE lessons (
  id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  module_id    BIGINT UNSIGNED NOT NULL,
  title        VARCHAR(160) NOT NULL,
  -- Markdown body; code snippets live inline as fenced blocks. No video, no labs.
  body_md      MEDIUMTEXT NOT NULL,
  sort_order   INT NOT NULL DEFAULT 0,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
  INDEX idx_lessons_module (module_id, sort_order)
) ENGINE=InnoDB;

-- Per-module completion, visible to admin. One row per (student, module).
CREATE TABLE progress (
  id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  student_id   BIGINT UNSIGNED NOT NULL,
  module_id    BIGINT UNSIGNED NOT NULL,
  status       ENUM('not_started','in_progress','completed') NOT NULL DEFAULT 'in_progress',
  completed_at TIMESTAMP NULL,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_progress (student_id, module_id),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (module_id)  REFERENCES modules(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
--  Test module  (separate component from course content)
-- ----------------------------------------------------------------------------
CREATE TABLE tests (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  track_id      BIGINT UNSIGNED NOT NULL,
  title         VARCHAR(160) NOT NULL,
  instructions  TEXT NULL,
  -- validity window applies to the test itself; each access code also has its own expiry
  opens_at      TIMESTAMP NULL,
  closes_at     TIMESTAMP NULL,
  duration_minutes INT NULL,           -- per-attempt time limit once unlocked
  total_points  INT NOT NULL DEFAULT 0,
  is_published  TINYINT(1) NOT NULL DEFAULT 0,
  created_by    BIGINT UNSIGNED NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (track_id)   REFERENCES tracks(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_tests_track (track_id)
) ENGINE=InnoDB;

-- A test question. For coding tracks: type='coding' + rows in test_cases.
-- For non-coding tracks: type in ('mcq','short_answer','query').
CREATE TABLE test_items (
  id             BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  test_id        BIGINT UNSIGNED NOT NULL,
  type           ENUM('coding','mcq','short_answer','query') NOT NULL,
  prompt_md      MEDIUMTEXT NOT NULL,
  points         INT NOT NULL DEFAULT 1,
  sort_order     INT NOT NULL DEFAULT 0,
  -- coding only: optional starter code shown to the student
  starter_code   MEDIUMTEXT NULL,
  -- short_answer / query: reference answer for manual or exact-match grading
  expected_answer MEDIUMTEXT NULL,
  -- query: how to grade — exact string match, or run against judge and compare output
  grading_mode   ENUM('auto_exact','auto_judge','manual') NULL,
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
  INDEX idx_items_test (test_id, sort_order)
) ENGINE=InnoDB;

-- MCQ choices
CREATE TABLE test_item_options (
  id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  item_id      BIGINT UNSIGNED NOT NULL,
  label        VARCHAR(500) NOT NULL,
  is_correct   TINYINT(1) NOT NULL DEFAULT 0,
  sort_order   INT NOT NULL DEFAULT 0,
  FOREIGN KEY (item_id) REFERENCES test_items(id) ON DELETE CASCADE,
  INDEX idx_options_item (item_id, sort_order)
) ENGINE=InnoDB;

-- Input / expected-output pairs for auto-grading coding submissions.
CREATE TABLE test_cases (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  item_id       BIGINT UNSIGNED NOT NULL,
  stdin         MEDIUMTEXT NOT NULL,
  expected_stdout MEDIUMTEXT NOT NULL,
  -- hidden cases are not shown to the student before/after submission
  is_sample     TINYINT(1) NOT NULL DEFAULT 0,
  weight        INT NOT NULL DEFAULT 1,
  sort_order    INT NOT NULL DEFAULT 0,
  FOREIGN KEY (item_id) REFERENCES test_items(id) ON DELETE CASCADE,
  INDEX idx_cases_item (item_id, sort_order)
) ENGINE=InnoDB;

-- Password gate: admin generates one unique, time-limited, one-time-use
-- access code per student per test. Separate from normal login.
CREATE TABLE test_access (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  test_id       BIGINT UNSIGNED NOT NULL,
  student_id    BIGINT UNSIGNED NOT NULL,
  -- only the hash is stored; the plaintext code is shown once at generation/export
  code_hash     VARCHAR(255) NOT NULL,
  code_last4    CHAR(4) NOT NULL,          -- for admin-side identification in reports
  expires_at    TIMESTAMP NOT NULL,
  used_at       TIMESTAMP NULL,            -- set on first successful unlock -> one-time use
  revoked_at    TIMESTAMP NULL,
  created_by    BIGINT UNSIGNED NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_access (test_id, student_id),
  FOREIGN KEY (test_id)    REFERENCES tests(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_access_student (student_id)
) ENGINE=InnoDB;

-- One row per student attempt at a test (created when the access code unlocks it).
CREATE TABLE submissions (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  test_id       BIGINT UNSIGNED NOT NULL,
  student_id    BIGINT UNSIGNED NOT NULL,
  access_id     BIGINT UNSIGNED NOT NULL,
  status        ENUM('in_progress','submitted','graded') NOT NULL DEFAULT 'in_progress',
  started_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at  TIMESTAMP NULL,
  graded_at     TIMESTAMP NULL,
  score         INT NULL,
  max_score     INT NULL,
  UNIQUE KEY uq_attempt (test_id, student_id),
  FOREIGN KEY (test_id)    REFERENCES tests(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (access_id)  REFERENCES test_access(id),
  INDEX idx_sub_test (test_id)
) ENGINE=InnoDB;

-- Per-item answer + grading detail for a submission.
CREATE TABLE submission_results (
  id             BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  submission_id  BIGINT UNSIGNED NOT NULL,
  item_id        BIGINT UNSIGNED NOT NULL,
  -- coding/query: submitted source; mcq: chosen option id(s) as CSV; short_answer: text
  answer_text    MEDIUMTEXT NULL,
  selected_option_id BIGINT UNSIGNED NULL,
  -- judge output summary for coding/query items
  cases_total    INT NULL,
  cases_passed   INT NULL,
  judge_stdout   MEDIUMTEXT NULL,
  judge_stderr   MEDIUMTEXT NULL,
  points_awarded INT NOT NULL DEFAULT 0,
  points_possible INT NOT NULL DEFAULT 0,
  needs_manual_review TINYINT(1) NOT NULL DEFAULT 0,
  graded_at      TIMESTAMP NULL,
  UNIQUE KEY uq_result (submission_id, item_id),
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id)       REFERENCES test_items(id) ON DELETE CASCADE,
  FOREIGN KEY (selected_option_id) REFERENCES test_item_options(id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
--  Reporting helper view: % module completion per student per track
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_track_progress AS
SELECT
  u.id                              AS student_id,
  u.roll_number,
  u.full_name,
  t.id                              AS track_id,
  t.slug                            AS track_slug,
  t.title                           AS track_title,
  COUNT(m.id)                       AS modules_total,
  SUM(p.status = 'completed')       AS modules_completed,
  ROUND(100 * SUM(p.status = 'completed') / NULLIF(COUNT(m.id), 0), 1) AS percent_complete
FROM users u
CROSS JOIN tracks t
JOIN modules m ON m.track_id = t.id AND m.is_published = 1
LEFT JOIN progress p ON p.module_id = m.id AND p.student_id = u.id
WHERE u.role = 'student'
GROUP BY u.id, t.id;

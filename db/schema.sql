-- ============================================================================
--  Student Programming Learning Platform — relational schema (MySQL 8.0)
--  Single DB for: users, tracks, modules, lessons, progress,
--                 tests, test_items, test_cases, test_access, submissions
-- ============================================================================

CREATE DATABASE IF NOT EXISTS learning_platform
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE learning_platform;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS item_submissions;
DROP TABLE IF EXISTS submission_results;
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS test_access;
DROP TABLE IF EXISTS test_cases;
DROP TABLE IF EXISTS test_item_options;
DROP TABLE IF EXISTS test_items;
DROP TABLE IF EXISTS tests;
DROP TABLE IF EXISTS module_quiz_attempts;
DROP TABLE IF EXISTS module_quiz_options;
DROP TABLE IF EXISTS module_quiz_questions;
DROP TABLE IF EXISTS module_quizzes;
DROP TABLE IF EXISTS progress;
DROP TABLE IF EXISTS lesson_views;
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
  -- admins sign in with a username + password; students sign in with Google
  -- (or, as a hidden fallback, email/roll number + password) and then set a
  -- username + roll number on first login
  roll_number   VARCHAR(32)  NULL UNIQUE,
  username      VARCHAR(64)  NULL UNIQUE,
  full_name     VARCHAR(120) NOT NULL,
  email         VARCHAR(190) NULL UNIQUE,
  google_sub    VARCHAR(40)  NULL UNIQUE,   -- Google account id, set on Google sign-in
  password_hash VARCHAR(255) NOT NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_identity CHECK (
    (role = 'admin' AND username IS NOT NULL) OR role = 'student'
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

-- One row per lesson a student has opened. Drives auto-completion.
CREATE TABLE lesson_views (
  student_id      BIGINT UNSIGNED NOT NULL,
  lesson_id       BIGINT UNSIGNED NOT NULL,
  first_viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_viewed_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, lesson_id),
  FOREIGN KEY (student_id) REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (lesson_id)  REFERENCES lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Per-module completion, visible to admin. One row per (student, module).
-- status is DERIVED, not set by hand: a module is 'completed' once the student
-- has opened every published lesson in it AND passed its quiz (if it has one).
CREATE TABLE progress (
  id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  student_id   BIGINT UNSIGNED NOT NULL,
  module_id    BIGINT UNSIGNED NOT NULL,
  status       ENUM('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
  completed_at TIMESTAMP NULL,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_progress (student_id, module_id),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (module_id)  REFERENCES modules(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
--  Module "check your understanding" quizzes
--
--  Part of COURSE DELIVERY, not the Test module: short MCQ self-checks that sit
--  on the module page (Cisco NetAcad style). No access code, retakeable,
--  immediate feedback with explanations. The admin-managed, code-gated exams
--  live separately in tests / test_items / test_access.
-- ----------------------------------------------------------------------------
CREATE TABLE module_quizzes (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  module_id     BIGINT UNSIGNED NOT NULL UNIQUE,   -- at most one quiz per module
  title         VARCHAR(160) NOT NULL DEFAULT 'Check Your Understanding',
  pass_percent  INT NOT NULL DEFAULT 70,           -- >= this marks the module complete
  is_published  TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE module_quiz_questions (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  quiz_id       BIGINT UNSIGNED NOT NULL,
  prompt_md     MEDIUMTEXT NOT NULL,
  -- 'mcq' = exactly one correct option; 'multi' = one or more correct options
  type          ENUM('mcq','multi') NOT NULL DEFAULT 'mcq',
  explanation_md TEXT NULL,                         -- shown after grading
  sort_order    INT NOT NULL DEFAULT 0,
  FOREIGN KEY (quiz_id) REFERENCES module_quizzes(id) ON DELETE CASCADE,
  INDEX idx_mqq_quiz (quiz_id, sort_order)
) ENGINE=InnoDB;

CREATE TABLE module_quiz_options (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  question_id   BIGINT UNSIGNED NOT NULL,
  label         VARCHAR(600) NOT NULL,
  is_correct    TINYINT(1) NOT NULL DEFAULT 0,
  sort_order    INT NOT NULL DEFAULT 0,
  FOREIGN KEY (question_id) REFERENCES module_quiz_questions(id) ON DELETE CASCADE,
  INDEX idx_mqo_question (question_id, sort_order)
) ENGINE=InnoDB;

-- Latest attempt per (student, quiz). Retaking overwrites. Visible to admin.
CREATE TABLE module_quiz_attempts (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  student_id    BIGINT UNSIGNED NOT NULL,
  quiz_id       BIGINT UNSIGNED NOT NULL,
  score         INT NOT NULL,
  max_score     INT NOT NULL,
  percent       INT NOT NULL,
  passed        TINYINT(1) NOT NULL,
  attempts      INT NOT NULL DEFAULT 1,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_mqa (student_id, quiz_id),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (quiz_id) REFERENCES module_quizzes(id) ON DELETE CASCADE
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
  show_leaderboard TINYINT(1) NOT NULL DEFAULT 1,
  scoring       ENUM('best','last') NOT NULL DEFAULT 'best',  -- which submission counts per item
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
  code_hash     VARCHAR(255) NOT NULL,     -- checked on unlock
  code_plain    VARCHAR(24) NULL,          -- shown in-app to that student only
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

-- One participation record per (test, student), created when the test unlocks.
-- Students may submit each item many times during the window; the best (or
-- last) result per item is rolled up into submission_results.
CREATE TABLE submissions (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  test_id       BIGINT UNSIGNED NOT NULL,
  student_id    BIGINT UNSIGNED NOT NULL,
  access_id     BIGINT UNSIGNED NOT NULL,
  status        ENUM('in_progress','submitted','graded') NOT NULL DEFAULT 'in_progress',
  submit_count  INT NOT NULL DEFAULT 0,
  started_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at  TIMESTAMP NULL,
  last_scored_at TIMESTAMP NULL,           -- most recent submission that raised the score
  graded_at     TIMESTAMP NULL,
  score         INT NULL,
  max_score     INT NULL,
  penalty_seconds INT NOT NULL DEFAULT 0,  -- leaderboard tiebreak: sum of time-to-best per solved item
  UNIQUE KEY uq_attempt (test_id, student_id),
  FOREIGN KEY (test_id)    REFERENCES tests(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (access_id)  REFERENCES test_access(id),
  INDEX idx_sub_test (test_id)
) ENGINE=InnoDB;

-- The best (or last) result per item for a participation - the scored rollup.
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
  best_at        TIMESTAMP NULL,           -- when this best score was first reached
  attempts       INT NOT NULL DEFAULT 0,
  language       VARCHAR(20) NULL,
  UNIQUE KEY uq_result (submission_id, item_id),
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id)       REFERENCES test_items(id) ON DELETE CASCADE,
  FOREIGN KEY (selected_option_id) REFERENCES test_item_options(id)
) ENGINE=InnoDB;

-- Full submission history: one row per Run / Submit of an item.
CREATE TABLE item_submissions (
  id             BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  submission_id  BIGINT UNSIGNED NOT NULL,
  item_id        BIGINT UNSIGNED NOT NULL,
  student_id     BIGINT UNSIGNED NOT NULL,
  kind           ENUM('run','submit') NOT NULL DEFAULT 'submit',
  answer_text    MEDIUMTEXT NULL,
  selected_option_id BIGINT UNSIGNED NULL,
  language       VARCHAR(20) NULL,
  cases_total    INT NULL,
  cases_passed   INT NULL,
  points_awarded INT NOT NULL DEFAULT 0,
  points_possible INT NOT NULL DEFAULT 0,
  verdict        VARCHAR(40) NULL,
  judge_stdout   MEDIUMTEXT NULL,
  judge_stderr   MEDIUMTEXT NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id)       REFERENCES test_items(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id)    REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_isub_sub (submission_id, item_id),
  INDEX idx_isub_item (item_id, kind)
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
  COALESCE(SUM(p.status = 'completed'), 0) AS modules_completed,
  ROUND(100 * COALESCE(SUM(p.status = 'completed'), 0) / NULLIF(COUNT(m.id), 0), 1) AS percent_complete
FROM users u
CROSS JOIN tracks t
JOIN modules m ON m.track_id = t.id AND m.is_published = 1
LEFT JOIN progress p ON p.module_id = m.id AND p.student_id = u.id
WHERE u.role = 'student'
GROUP BY u.id, t.id;

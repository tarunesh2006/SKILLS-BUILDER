-- Migration: contest-style tests (assignment, in-app tokens, per-item
-- multi-submission, leaderboard) + Google sign-in plumbing for students.
--
-- Run ONCE against a database created before these features. New installs get
-- everything from schema.sql. (MySQL 8 has no ADD COLUMN IF NOT EXISTS, so this
-- is not re-runnable.)
--   docker compose exec -T mysql mysql -uroot -proot --default-character-set=utf8mb4 learning_platform < db/migrations/003_contest_tests.sql
USE learning_platform;

-- ---- users: Google sign-in --------------------------------------------------
ALTER TABLE users ADD COLUMN google_sub VARCHAR(40) NULL UNIQUE AFTER email;

-- a student may exist before they have set a roll number (first Google login)
ALTER TABLE users DROP CHECK chk_identity;
ALTER TABLE users ADD CONSTRAINT chk_identity CHECK (
  (role = 'admin' AND username IS NOT NULL) OR role = 'student'
);

-- ---- tests: contest options ----------------------------------------------
ALTER TABLE tests
  ADD COLUMN show_leaderboard TINYINT(1) NOT NULL DEFAULT 1 AFTER is_published,
  ADD COLUMN scoring ENUM('best','last') NOT NULL DEFAULT 'best' AFTER show_leaderboard;

-- ---- test_access: the token the student sees in-app ----------------------
ALTER TABLE test_access ADD COLUMN code_plain VARCHAR(24) NULL AFTER code_hash;

-- ---- submissions: track attempts + leaderboard tiebreak -----------------
ALTER TABLE submissions
  ADD COLUMN submit_count INT NOT NULL DEFAULT 0 AFTER status,
  ADD COLUMN last_scored_at TIMESTAMP NULL AFTER submitted_at,
  ADD COLUMN penalty_seconds INT NOT NULL DEFAULT 0 AFTER max_score;

-- ---- submission_results: the best result per item -----------------------
ALTER TABLE submission_results
  ADD COLUMN best_at TIMESTAMP NULL AFTER graded_at,
  ADD COLUMN attempts INT NOT NULL DEFAULT 0 AFTER best_at,
  ADD COLUMN language VARCHAR(20) NULL AFTER attempts;

-- ---- item_submissions: full history, one row per graded Submit ----------
CREATE TABLE IF NOT EXISTS item_submissions (
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

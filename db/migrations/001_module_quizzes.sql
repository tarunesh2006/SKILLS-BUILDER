-- Migration: add module "check your understanding" quizzes.
-- Apply to an existing database (new installs get these from schema.sql):
--   docker compose exec -T mysql mysql -uroot -proot --default-character-set=utf8mb4 learning_platform < db/migrations/001_module_quizzes.sql
USE learning_platform;

CREATE TABLE IF NOT EXISTS module_quizzes (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  module_id     BIGINT UNSIGNED NOT NULL UNIQUE,
  title         VARCHAR(160) NOT NULL DEFAULT 'Check Your Understanding',
  pass_percent  INT NOT NULL DEFAULT 70,
  is_published  TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS module_quiz_questions (
  id             BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  quiz_id        BIGINT UNSIGNED NOT NULL,
  prompt_md      MEDIUMTEXT NOT NULL,
  type           ENUM('mcq','multi') NOT NULL DEFAULT 'mcq',
  explanation_md TEXT NULL,
  sort_order     INT NOT NULL DEFAULT 0,
  FOREIGN KEY (quiz_id) REFERENCES module_quizzes(id) ON DELETE CASCADE,
  INDEX idx_mqq_quiz (quiz_id, sort_order)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS module_quiz_options (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  question_id   BIGINT UNSIGNED NOT NULL,
  label         VARCHAR(600) NOT NULL,
  is_correct    TINYINT(1) NOT NULL DEFAULT 0,
  sort_order    INT NOT NULL DEFAULT 0,
  FOREIGN KEY (question_id) REFERENCES module_quiz_questions(id) ON DELETE CASCADE,
  INDEX idx_mqo_question (question_id, sort_order)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS module_quiz_attempts (
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

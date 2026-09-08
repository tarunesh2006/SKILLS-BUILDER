-- Migration: track lesson views and switch module completion to automatic.
--   docker compose exec -T mysql mysql -uroot -proot --default-character-set=utf8mb4 learning_platform < db/migrations/002_lesson_views.sql
USE learning_platform;

CREATE TABLE IF NOT EXISTS lesson_views (
  student_id      BIGINT UNSIGNED NOT NULL,
  lesson_id       BIGINT UNSIGNED NOT NULL,
  first_viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_viewed_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, lesson_id),
  FOREIGN KEY (student_id) REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (lesson_id)  REFERENCES lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- default for new rows is now 'not_started'; existing rows are left as-is
ALTER TABLE progress MODIFY status
  ENUM('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started';

/**
 * Automatic module completion (Cisco NetAcad style).
 *
 * A module's progress status is DERIVED, never set by hand:
 *   - completed   : every published lesson opened AND the quiz passed
 *                   (a module with no quiz just needs all lessons opened)
 *   - in_progress : some lessons opened, or the quiz attempted, but not done
 *   - not_started : no activity
 *
 * recomputeModuleProgress() is called after a lesson view and after a quiz
 * submission; it writes the derived status into `progress`.
 */
const db = require('../db');

/** Record that a student opened a lesson (idempotent), then refresh its module. */
async function markLessonViewed(studentId, lessonId) {
  const lesson = await db.one(
    `SELECT l.id, l.module_id FROM lessons l WHERE l.id = :id AND l.is_published = 1`,
    { id: lessonId },
  );
  if (!lesson) return null;

  await db.query(
    `INSERT INTO lesson_views (student_id, lesson_id) VALUES (:sid, :lid)
     ON DUPLICATE KEY UPDATE last_viewed_at = CURRENT_TIMESTAMP`,
    { sid: studentId, lid: lessonId },
  );

  await recomputeModuleProgress(studentId, lesson.module_id);
  return lesson.module_id;
}

/** Returns the counts that decide a module's status for one student. */
async function moduleCompletionStats(studentId, moduleId) {
  const row = await db.one(
    `SELECT
        (SELECT COUNT(*) FROM lessons
          WHERE module_id = :mid AND is_published = 1)                        AS lessons_total,
        (SELECT COUNT(*) FROM lesson_views v
           JOIN lessons l ON l.id = v.lesson_id
          WHERE l.module_id = :mid AND l.is_published = 1
            AND v.student_id = :sid)                                          AS lessons_viewed,
        (SELECT q.id FROM module_quizzes q
          WHERE q.module_id = :mid AND q.is_published = 1
            AND EXISTS (SELECT 1 FROM module_quiz_questions qq WHERE qq.quiz_id = q.id)
          LIMIT 1)                                                            AS quiz_id,
        (SELECT a.passed FROM module_quiz_attempts a
           JOIN module_quizzes q ON q.id = a.quiz_id
          WHERE q.module_id = :mid AND a.student_id = :sid LIMIT 1)           AS quiz_passed,
        (SELECT COUNT(*) FROM module_quiz_attempts a
           JOIN module_quizzes q ON q.id = a.quiz_id
          WHERE q.module_id = :mid AND a.student_id = :sid)                   AS quiz_attempts`,
    { mid: moduleId, sid: studentId },
  );

  const lessonsTotal = Number(row.lessons_total);
  const lessonsViewed = Number(row.lessons_viewed);
  const hasQuiz = row.quiz_id != null;
  const quizPassed = row.quiz_passed === 1;
  const quizAttempts = Number(row.quiz_attempts);

  const lessonsDone = lessonsTotal > 0 && lessonsViewed >= lessonsTotal;
  const quizDone = !hasQuiz || quizPassed;
  const hasContent = lessonsTotal > 0 || hasQuiz;

  let status = 'not_started';
  if (hasContent && lessonsDone && quizDone) status = 'completed';
  else if (lessonsViewed > 0 || quizAttempts > 0) status = 'in_progress';

  return {
    status,
    lessonsTotal,
    lessonsViewed,
    hasQuiz,
    quizPassed,
    quizAttempts,
  };
}

/** Derive and persist a module's status for one student. */
async function recomputeModuleProgress(studentId, moduleId) {
  const stats = await moduleCompletionStats(studentId, moduleId);

  await db.query(
    `INSERT INTO progress (student_id, module_id, status, completed_at)
     VALUES (:sid, :mid, :status, :completedAt)
     ON DUPLICATE KEY UPDATE
       status = VALUES(status),
       completed_at = CASE
         WHEN VALUES(status) = 'completed' THEN COALESCE(completed_at, CURRENT_TIMESTAMP)
         ELSE NULL
       END`,
    {
      sid: studentId,
      mid: moduleId,
      status: stats.status,
      completedAt: stats.status === 'completed' ? new Date() : null,
    },
  );

  return stats;
}

/** Which lesson ids in a track this student has opened. */
async function viewedLessonIds(studentId, trackId) {
  const rows = await db.query(
    `SELECT v.lesson_id FROM lesson_views v
       JOIN lessons l ON l.id = v.lesson_id
       JOIN modules m ON m.id = l.module_id
      WHERE m.track_id = :tid AND v.student_id = :sid`,
    { tid: trackId, sid: studentId },
  );
  return new Set(rows.map((r) => r.lesson_id));
}

module.exports = {
  markLessonViewed,
  recomputeModuleProgress,
  moduleCompletionStats,
  viewedLessonIds,
};

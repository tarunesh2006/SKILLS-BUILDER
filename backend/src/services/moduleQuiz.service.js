/**
 * Module "check your understanding" quizzes — part of course delivery.
 *
 * Short MCQ self-checks shown on the module page. No access code, retakeable,
 * immediate feedback. Passing (>= quiz.pass_percent) marks the module complete.
 */
const db = require('../db');
const { notFound, badRequest } = require('../utils/http');

/** Full quiz for authoring / grading (includes is_correct). */
async function loadQuizByModule(moduleId) {
  const quiz = await db.one(
    `SELECT mq.*, m.track_id, m.title AS module_title
       FROM module_quizzes mq JOIN modules m ON m.id = mq.module_id
      WHERE mq.module_id = :moduleId`,
    { moduleId },
  );
  if (!quiz) return null;
  const questions = await db.query(
    `SELECT id, prompt_md, type, explanation_md, sort_order
       FROM module_quiz_questions WHERE quiz_id = :qid ORDER BY sort_order, id`,
    { qid: quiz.id },
  );
  const options = questions.length
    ? await db.query(
      `SELECT id, question_id, label, is_correct, sort_order
         FROM module_quiz_options
        WHERE question_id IN (${questions.map(() => '?').join(',')})
        ORDER BY sort_order, id`,
      questions.map((q) => q.id),
    )
    : [];
  quiz.questions = questions.map((q) => ({
    ...q,
    options: options.filter((o) => o.question_id === q.id),
  }));
  return quiz;
}

/** Student-facing view: no is_correct, no explanations. */
function toStudentView(quiz) {
  return {
    id: quiz.id,
    moduleId: quiz.module_id,
    title: quiz.title,
    passPercent: quiz.pass_percent,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      promptMd: q.prompt_md,
      type: q.type,
      options: q.options.map((o) => ({ id: o.id, label: o.label })),
    })),
  };
}

/**
 * Grade { questionId -> [optionId, ...] } answers.
 * All-or-nothing per question. Returns score, percent, passed and per-question
 * detail (correct option ids + explanation) for review.
 */
async function grade({ moduleId, studentId, answers }) {
  const quiz = await loadQuizByModule(moduleId);
  if (!quiz || !quiz.is_published) throw notFound('This module has no quiz');
  if (quiz.questions.length === 0) throw badRequest('This quiz has no questions yet');

  const chosen = new Map(
    (answers || []).map((a) => [
      Number(a.questionId),
      new Set((a.optionIds || []).map(Number)),
    ]),
  );

  let score = 0;
  const detail = quiz.questions.map((q) => {
    const correct = new Set(q.options.filter((o) => o.is_correct).map((o) => o.id));
    const picked = chosen.get(q.id) || new Set();
    const isCorrect = correct.size === picked.size
      && [...correct].every((id) => picked.has(id));
    if (isCorrect) score += 1;
    return {
      questionId: q.id,
      correct: isCorrect,
      correctOptionIds: [...correct],
      explanationMd: q.explanation_md || null,
    };
  });

  const max = quiz.questions.length;
  const percent = Math.round((100 * score) / max);
  const passed = percent >= quiz.pass_percent;

  await db.query(
    `INSERT INTO module_quiz_attempts (student_id, quiz_id, score, max_score, percent, passed, attempts)
     VALUES (:sid, :qid, :score, :max, :percent, :passed, 1)
     ON DUPLICATE KEY UPDATE
       score = VALUES(score), max_score = VALUES(max_score),
       percent = VALUES(percent), passed = VALUES(passed),
       attempts = attempts + 1`,
    { sid: studentId, qid: quiz.id, score, max, percent, passed: passed ? 1 : 0 },
  );

  // Passing the check marks the module complete (Cisco-style gate).
  if (passed) {
    await db.query(
      `INSERT INTO progress (student_id, module_id, status, completed_at)
       VALUES (:sid, :mid, 'completed', CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE status = 'completed',
         completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)`,
      { sid: studentId, mid: moduleId },
    );
  }

  return { score, maxScore: max, percent, passed, passPercent: quiz.pass_percent, detail };
}

module.exports = { loadQuizByModule, toStudentView, grade };

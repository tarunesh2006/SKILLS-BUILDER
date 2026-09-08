const express = require('express');
const { z } = require('zod');
const db = require('../db');
const { asyncHandler, notFound } = require('../utils/http');
const { authenticate, requireRole } = require('../middleware/auth');
const { body } = require('../utils/validate');
const moduleQuiz = require('../services/moduleQuiz.service');

const router = express.Router();
router.use(authenticate); // catalog is for logged-in students/admins

// GET /catalog — the 8 tracks
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const tracks = await db.query(
      `SELECT id, slug, title, description, kind, sort_order
         FROM tracks
        WHERE is_published = 1
        ORDER BY sort_order, id`,
    );
    res.json({ tracks });
  }),
);

// GET /catalog/:slug — track with its modules + lesson titles, plus this
// student's per-module progress
router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const track = await db.one(
      `SELECT id, slug, title, description, kind FROM tracks WHERE slug = :slug AND is_published = 1`,
      { slug: req.params.slug },
    );
    if (!track) throw notFound('Track not found');

    const modules = await db.query(
      `SELECT id, title, summary, sort_order
         FROM modules WHERE track_id = :tid AND is_published = 1
        ORDER BY sort_order, id`,
      { tid: track.id },
    );

    const lessons = await db.query(
      `SELECT l.id, l.module_id, l.title, l.sort_order
         FROM lessons l JOIN modules m ON m.id = l.module_id
        WHERE m.track_id = :tid AND l.is_published = 1
        ORDER BY l.sort_order, l.id`,
      { tid: track.id },
    );

    let progressByModule = {};
    let attemptByQuiz = {};
    if (req.user.role === 'student') {
      const rows = await db.query(
        `SELECT module_id, status, completed_at FROM progress WHERE student_id = :sid`,
        { sid: req.user.id },
      );
      progressByModule = Object.fromEntries(rows.map((r) => [r.module_id, r]));

      const attempts = await db.query(
        `SELECT a.quiz_id, a.percent, a.passed
           FROM module_quiz_attempts a
           JOIN module_quizzes q ON q.id = a.quiz_id
           JOIN modules m ON m.id = q.module_id
          WHERE a.student_id = :sid AND m.track_id = :tid`,
        { sid: req.user.id, tid: track.id },
      );
      attemptByQuiz = Object.fromEntries(attempts.map((a) => [a.quiz_id, a]));
    }

    // one lightweight row per module quiz (id + question count), no answers
    const quizzes = await db.query(
      `SELECT q.id, q.module_id, q.title, q.pass_percent,
              COUNT(qq.id) AS question_count
         FROM module_quizzes q
         JOIN modules m ON m.id = q.module_id
    LEFT JOIN module_quiz_questions qq ON qq.quiz_id = q.id
        WHERE m.track_id = :tid AND q.is_published = 1
        GROUP BY q.id`,
      { tid: track.id },
    );
    const quizByModule = Object.fromEntries(quizzes.map((q) => [q.module_id, q]));

    res.json({
      track,
      modules: modules.map((m) => {
        const q = quizByModule[m.id];
        return {
          ...m,
          lessons: lessons.filter((l) => l.module_id === m.id)
            .map(({ module_id, ...rest }) => rest),
          progress: progressByModule[m.id] || { status: 'not_started' },
          quiz: q
            ? {
              id: q.id,
              title: q.title,
              questionCount: Number(q.question_count),
              passPercent: q.pass_percent,
              attempt: attemptByQuiz[q.id] || null,
            }
            : null,
        };
      }),
    });
  }),
);

// GET /catalog/modules/:moduleId/quiz — questions + options, no answers
router.get(
  '/modules/:moduleId/quiz',
  asyncHandler(async (req, res) => {
    const quiz = await moduleQuiz.loadQuizByModule(req.params.moduleId);
    if (!quiz || !quiz.is_published) throw notFound('This module has no quiz');
    const view = moduleQuiz.toStudentView(quiz);
    if (req.user.role === 'student') {
      const attempt = await db.one(
        `SELECT score, max_score, percent, passed, attempts
           FROM module_quiz_attempts WHERE student_id = :sid AND quiz_id = :qid`,
        { sid: req.user.id, qid: quiz.id },
      );
      view.lastAttempt = attempt || null;
    }
    res.json({ quiz: view });
  }),
);

// POST /catalog/modules/:moduleId/quiz/submit — grade and return feedback
router.post(
  '/modules/:moduleId/quiz/submit',
  requireRole('student'),
  body(z.object({
    answers: z.array(z.object({
      questionId: z.coerce.number().int().positive(),
      optionIds: z.array(z.coerce.number().int().positive()).default([]),
    })).min(1),
  })),
  asyncHandler(async (req, res) => {
    const result = await moduleQuiz.grade({
      moduleId: Number(req.params.moduleId),
      studentId: req.user.id,
      answers: req.body.answers,
    });
    res.json(result);
  }),
);

// GET /catalog/lessons/:id — a single lesson's markdown body
router.get(
  '/lessons/:id',
  asyncHandler(async (req, res) => {
    const lesson = await db.one(
      `SELECT l.id, l.module_id, l.title, l.body_md, m.track_id
         FROM lessons l JOIN modules m ON m.id = l.module_id
        WHERE l.id = :id AND l.is_published = 1`,
      { id: req.params.id },
    );
    if (!lesson) throw notFound('Lesson not found');
    res.json({ lesson });
  }),
);

module.exports = router;

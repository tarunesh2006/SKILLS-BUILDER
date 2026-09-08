const express = require('express');
const { z } = require('zod');
const db = require('../db');
const { asyncHandler, notFound, forbidden, badRequest, conflict } = require('../utils/http');
const { authenticate, requireRole } = require('../middleware/auth');
const { body } = require('../utils/validate');
const accessCodes = require('../services/accessCode.service');
const grading = require('../services/grading.service');

const router = express.Router();
router.use(authenticate, requireRole('student'));

const unlockSchema = z.object({ code: z.string().trim().min(4).max(40) });
const answerSchema = z.object({
  answers: z.array(z.object({
    itemId: z.coerce.number().int().positive(),
    answerText: z.string().max(200000).optional(),
    selectedOptionId: z.coerce.number().int().positive().optional(),
  })).min(1),
});

function testWindowOpen(test) {
  const now = Date.now();
  if (test.opens_at && new Date(test.opens_at).getTime() > now) return false;
  if (test.closes_at && new Date(test.closes_at).getTime() < now) return false;
  return true;
}

// GET /tests — tests for which this student has an access code
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await db.query(
      `SELECT t.id, t.title, t.track_id, tr.title AS track_title, tr.slug AS track_slug,
              t.opens_at, t.closes_at, t.duration_minutes, t.total_points,
              ta.expires_at AS code_expires_at, ta.used_at AS code_used_at, ta.revoked_at,
              s.status AS submission_status, s.score, s.max_score
         FROM test_access ta
         JOIN tests t  ON t.id = ta.test_id AND t.is_published = 1
         JOIN tracks tr ON tr.id = t.track_id
    LEFT JOIN submissions s ON s.test_id = t.id AND s.student_id = ta.student_id
        WHERE ta.student_id = :sid
        ORDER BY t.closes_at IS NULL, t.closes_at`,
      { sid: req.user.id },
    );
    res.json({ tests: rows });
  }),
);

// POST /tests/:id/unlock — redeem the one-time access code, create an attempt
router.post(
  '/:id/unlock',
  body(unlockSchema),
  asyncHandler(async (req, res) => {
    const test = await db.one(
      `SELECT * FROM tests WHERE id = :id AND is_published = 1`,
      { id: req.params.id },
    );
    if (!test) throw notFound('Test not found');
    if (!testWindowOpen(test)) throw forbidden('This test is not open right now');

    const existing = await db.one(
      `SELECT * FROM submissions WHERE test_id = :tid AND student_id = :sid`,
      { tid: test.id, sid: req.user.id },
    );
    if (existing && existing.status !== 'in_progress') {
      throw conflict('You have already submitted this test');
    }

    const attempt = await db.transaction(async (conn) => {
      // redeem() marks the code used; do it inside the txn
      const accessId = await accessCodes.redeem({
        testId: test.id, studentId: req.user.id, code: req.body.code,
      });
      if (existing) return existing;
      const [ins] = await conn.execute(
        `INSERT INTO submissions (test_id, student_id, access_id) VALUES (:tid, :sid, :aid)`,
        { tid: test.id, sid: req.user.id, aid: accessId },
      );
      return { id: ins.insertId, status: 'in_progress', started_at: new Date() };
    });

    res.json({ submissionId: attempt.id, startedAt: attempt.started_at,
      durationMinutes: test.duration_minutes });
  }),
);

async function loadActiveAttempt(studentId, testId) {
  const attempt = await db.one(
    `SELECT * FROM submissions WHERE test_id = :tid AND student_id = :sid`,
    { tid: testId, sid: studentId },
  );
  if (!attempt) throw forbidden('Unlock the test first with your access code');
  return attempt;
}

// GET /tests/:id/items — the questions, WITHOUT correct answers / hidden cases
router.get(
  '/:id/items',
  asyncHandler(async (req, res) => {
    await loadActiveAttempt(req.user.id, req.params.id);
    const items = await db.query(
      `SELECT id, type, prompt_md, points, sort_order, starter_code
         FROM test_items WHERE test_id = :tid ORDER BY sort_order, id`,
      { tid: req.params.id },
    );
    const options = await db.query(
      `SELECT o.id, o.item_id, o.label, o.sort_order
         FROM test_item_options o JOIN test_items i ON i.id = o.item_id
        WHERE i.test_id = :tid ORDER BY o.sort_order, o.id`,
      { tid: req.params.id },
    );
    const sampleCases = await db.query(
      `SELECT c.id, c.item_id, c.stdin, c.expected_stdout
         FROM test_cases c JOIN test_items i ON i.id = c.item_id
        WHERE i.test_id = :tid AND c.is_sample = 1 ORDER BY c.sort_order, c.id`,
      { tid: req.params.id },
    );
    res.json({
      items: items.map((it) => ({
        ...it,
        options: options.filter((o) => o.item_id === it.id)
          .map(({ item_id, ...r }) => r),
        sampleCases: sampleCases.filter((c) => c.item_id === it.id)
          .map(({ item_id, ...r }) => r),
      })),
    });
  }),
);

// PUT /tests/:id/answers — save/replace answers while in progress (autosave)
router.put(
  '/:id/answers',
  body(answerSchema),
  asyncHandler(async (req, res) => {
    const attempt = await loadActiveAttempt(req.user.id, req.params.id);
    if (attempt.status !== 'in_progress') throw conflict('This attempt is already submitted');

    const validItems = new Set(
      (await db.query(`SELECT id FROM test_items WHERE test_id = :tid`, { tid: req.params.id }))
        .map((r) => r.id),
    );

    await db.transaction(async (conn) => {
      for (const a of req.body.answers) {
        if (!validItems.has(a.itemId)) continue;
        // eslint-disable-next-line no-await-in-loop
        await conn.execute(
          `INSERT INTO submission_results (submission_id, item_id, answer_text, selected_option_id)
           VALUES (:sid, :iid, :text, :opt)
           ON DUPLICATE KEY UPDATE answer_text = VALUES(answer_text),
                                   selected_option_id = VALUES(selected_option_id)`,
          {
            sid: attempt.id, iid: a.itemId,
            text: a.answerText ?? null, opt: a.selectedOptionId ?? null,
          },
        );
      }
    });
    res.json({ ok: true });
  }),
);

// POST /tests/:id/submit — finalize + grade
router.post(
  '/:id/submit',
  asyncHandler(async (req, res) => {
    const attempt = await loadActiveAttempt(req.user.id, req.params.id);
    if (attempt.status !== 'in_progress') throw conflict('Already submitted');

    await db.query(
      `UPDATE submissions SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP WHERE id = :id`,
      { id: attempt.id },
    );

    let grade;
    try {
      grade = await grading.gradeSubmission(attempt.id);
    } catch (err) {
      // grading (judge) failure shouldn't lose the submission
      console.error('grading failed', err);
      return res.json({ status: 'submitted', graded: false,
        message: 'Submitted. Auto-grading is pending.' });
    }
    res.json({ status: 'graded', ...grade });
  }),
);

// GET /tests/:id/result — the student's own graded result
router.get(
  '/:id/result',
  asyncHandler(async (req, res) => {
    const attempt = await loadActiveAttempt(req.user.id, req.params.id);
    const results = await db.query(
      `SELECT sr.item_id, i.type, i.points, sr.points_awarded, sr.points_possible,
              sr.cases_total, sr.cases_passed, sr.needs_manual_review
         FROM submission_results sr JOIN test_items i ON i.id = sr.item_id
        WHERE sr.submission_id = :id ORDER BY i.sort_order`,
      { id: attempt.id },
    );
    res.json({
      status: attempt.status, score: attempt.score, maxScore: attempt.max_score, results,
    });
  }),
);

module.exports = router;

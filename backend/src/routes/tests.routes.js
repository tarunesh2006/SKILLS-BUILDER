const express = require('express');
const { z } = require('zod');
const db = require('../db');
const { asyncHandler, notFound, forbidden, conflict } = require('../utils/http');
const { authenticate, requireRole } = require('../middleware/auth');
const { body } = require('../utils/validate');
const accessCodes = require('../services/accessCode.service');
const contest = require('../services/contest.service');

const router = express.Router();
router.use(authenticate, requireRole('student'));

function windowState(test) {
  const now = Date.now();
  const opens = test.opens_at ? new Date(test.opens_at).getTime() : null;
  const closes = test.closes_at ? new Date(test.closes_at).getTime() : null;
  if (opens && now < opens) return 'upcoming';
  if (closes && now > closes) return 'ended';
  return 'live';
}

// GET /tests — every test this student is assigned to (has an access code for)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await db.query(
      `SELECT t.id, t.title, t.instructions, t.track_id,
              tr.title AS track_title, tr.slug AS track_slug, tr.kind AS track_kind,
              t.opens_at, t.closes_at, t.duration_minutes, t.total_points,
              t.show_leaderboard,
              ta.code_plain, ta.expires_at AS code_expires_at,
              ta.used_at AS code_used_at, ta.revoked_at,
              s.id AS submission_id, s.status AS submission_status,
              s.score, s.max_score, s.started_at,
              (SELECT COUNT(*) FROM test_items WHERE test_id = t.id) AS item_count
         FROM test_access ta
         JOIN tests t   ON t.id = ta.test_id AND t.is_published = 1
         JOIN tracks tr ON tr.id = t.track_id
    LEFT JOIN submissions s ON s.test_id = t.id AND s.student_id = ta.student_id
        WHERE ta.student_id = :sid
        ORDER BY t.opens_at IS NULL, t.opens_at DESC, t.id DESC`,
      { sid: req.user.id },
    );
    res.json({
      tests: rows.map((r) => ({
        id: r.id,
        title: r.title,
        instructions: r.instructions,
        trackTitle: r.track_title,
        trackSlug: r.track_slug,
        trackKind: r.track_kind,
        itemCount: Number(r.item_count),
        totalPoints: r.total_points,
        opensAt: r.opens_at,
        closesAt: r.closes_at,
        durationMinutes: r.duration_minutes,
        showLeaderboard: !!r.show_leaderboard,
        window: windowState(r),
        accessCode: r.revoked_at ? null : r.code_plain,
        codeRevoked: !!r.revoked_at,
        started: !!r.submission_id,
        submissionStatus: r.submission_status || null,
        score: r.score,
        maxScore: r.max_score,
      })),
    });
  }),
);

// GET /tests/:id — test detail + this student's participation state
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const test = await db.one(
      `SELECT t.*, tr.title AS track_title, tr.slug AS track_slug, tr.kind AS track_kind
         FROM tests t JOIN tracks tr ON tr.id = t.track_id
        WHERE t.id = :id AND t.is_published = 1`,
      { id: req.params.id },
    );
    if (!test) throw notFound('Test not found');
    const access = await db.one(
      `SELECT * FROM test_access WHERE test_id = :tid AND student_id = :sid`,
      { tid: test.id, sid: req.user.id },
    );
    if (!access) throw forbidden('You have not been assigned this test');

    const submission = await db.one(
      `SELECT * FROM submissions WHERE test_id = :tid AND student_id = :sid`,
      { tid: test.id, sid: req.user.id },
    );
    res.json({
      test: {
        id: test.id, title: test.title, instructions: test.instructions,
        trackTitle: test.track_title, trackKind: test.track_kind,
        opensAt: test.opens_at, closesAt: test.closes_at,
        durationMinutes: test.duration_minutes, totalPoints: test.total_points,
        showLeaderboard: !!test.show_leaderboard, scoring: test.scoring,
        window: windowState(test),
      },
      access: {
        code: access.revoked_at ? null : access.code_plain,
        revoked: !!access.revoked_at,
        used: !!access.used_at,
      },
      participation: submission
        ? {
          submissionId: submission.id,
          status: submission.status,
          startedAt: submission.started_at,
          endsAt: contest.attemptEndsAt(test, submission),
          score: submission.score,
          maxScore: submission.max_score,
          submitCount: submission.submit_count,
        }
        : null,
    });
  }),
);

// POST /tests/:id/start — consume the delivered code and begin the attempt
router.post(
  '/:id/start',
  body(z.object({ code: z.string().trim().min(4).max(40).optional() })),
  asyncHandler(async (req, res) => {
    const test = await db.one(
      `SELECT * FROM tests WHERE id = :id AND is_published = 1`, { id: req.params.id },
    );
    if (!test) throw notFound('Test not found');
    if (windowState(test) === 'upcoming') throw forbidden('This test has not started yet');
    if (windowState(test) === 'ended') throw forbidden('This test has ended');

    const access = await db.one(
      `SELECT * FROM test_access WHERE test_id = :tid AND student_id = :sid`,
      { tid: test.id, sid: req.user.id },
    );
    if (!access) throw forbidden('You have not been assigned this test');

    const existing = await db.one(
      `SELECT * FROM submissions WHERE test_id = :tid AND student_id = :sid`,
      { tid: test.id, sid: req.user.id },
    );
    if (existing) {
      if (existing.status !== 'in_progress') throw conflict('You have already finished this test');
      return res.json({
        submissionId: existing.id, startedAt: existing.started_at,
        endsAt: contest.attemptEndsAt(test, existing), resumed: true,
      });
    }

    // the code is delivered in-app; accept the student's own code (or none)
    const code = req.body.code || access.code_plain;
    const attempt = await db.transaction(async (conn) => {
      const accessId = await accessCodes.redeem({ testId: test.id, studentId: req.user.id, code });
      const [ins] = await conn.execute(
        `INSERT INTO submissions (test_id, student_id, access_id) VALUES (:tid, :sid, :aid)`,
        { tid: test.id, sid: req.user.id, aid: accessId },
      );
      return { id: ins.insertId, started_at: new Date() };
    });

    const withStart = { started_at: attempt.started_at };
    res.json({
      submissionId: attempt.id,
      startedAt: attempt.started_at,
      endsAt: contest.attemptEndsAt(test, withStart),
    });
  }),
);

async function requireActive(studentId, testId) {
  const submission = await db.one(
    `SELECT * FROM submissions WHERE test_id = :tid AND student_id = :sid`,
    { tid: testId, sid: studentId },
  );
  if (!submission) throw forbidden('Start the test first');
  return submission;
}

// GET /tests/:id/items — questions + this student's best result per item
router.get(
  '/:id/items',
  asyncHandler(async (req, res) => {
    const submission = await requireActive(req.user.id, req.params.id);
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
    const samples = await db.query(
      `SELECT c.id, c.item_id, c.stdin, c.expected_stdout
         FROM test_cases c JOIN test_items i ON i.id = c.item_id
        WHERE i.test_id = :tid AND c.is_sample = 1 ORDER BY c.sort_order, c.id`,
      { tid: req.params.id },
    );
    const mine = await db.query(
      `SELECT item_id, answer_text, selected_option_id, points_awarded, points_possible,
              cases_total, cases_passed, needs_manual_review, attempts
         FROM submission_results WHERE submission_id = :sid`,
      { sid: submission.id },
    );
    const caseCount = await db.query(
      `SELECT i.id AS item_id, COUNT(c.id) AS n
         FROM test_items i LEFT JOIN test_cases c ON c.item_id = i.id
        WHERE i.test_id = :tid GROUP BY i.id`,
      { tid: req.params.id },
    );
    const totalCasesByItem = Object.fromEntries(caseCount.map((c) => [c.item_id, Number(c.n)]));
    const mineByItem = Object.fromEntries(mine.map((m) => [m.item_id, m]));

    res.json({
      items: items.map((it) => {
        const m = mineByItem[it.id];
        return {
          ...it,
          options: options.filter((o) => o.item_id === it.id).map(({ item_id, ...r }) => r),
          sampleCases: samples.filter((c) => c.item_id === it.id).map(({ item_id, ...r }) => r),
          totalCases: totalCasesByItem[it.id] || 0,
          my: m
            ? {
              answerText: m.answer_text,
              selectedOptionId: m.selected_option_id,
              pointsAwarded: m.points_awarded,
              pointsPossible: m.points_possible,
              casesPassed: m.cases_passed,
              casesTotal: m.cases_total,
              attempts: m.attempts,
              needsManualReview: !!m.needs_manual_review,
            }
            : null,
        };
      }),
    });
  }),
);

// POST /tests/:id/items/:itemId/run — coding only, run against sample cases
router.post(
  '/:id/items/:itemId/run',
  body(z.object({ source: z.string().max(200000) })),
  asyncHandler(async (req, res) => {
    const out = await contest.runSamples({
      testId: Number(req.params.id),
      itemId: Number(req.params.itemId),
      studentId: req.user.id,
      source: req.body.source,
    });
    res.json(out);
  }),
);

// POST /tests/:id/items/:itemId/submit — grade against all cases, update score
router.post(
  '/:id/items/:itemId/submit',
  body(z.object({
    answerText: z.string().max(200000).optional(),
    selectedOptionId: z.coerce.number().int().positive().optional(),
  })),
  asyncHandler(async (req, res) => {
    const out = await contest.submitItem({
      testId: Number(req.params.id),
      itemId: Number(req.params.itemId),
      studentId: req.user.id,
      answerText: req.body.answerText,
      selectedOptionId: req.body.selectedOptionId,
    });
    res.json(out);
  }),
);

// POST /tests/:id/finish — end the attempt early
router.post(
  '/:id/finish',
  asyncHandler(async (req, res) => {
    const result = await contest.finish({ testId: Number(req.params.id), studentId: req.user.id });
    res.json({ status: result.status });
  }),
);

// GET /tests/:id/result — this student's per-item outcome
router.get(
  '/:id/result',
  asyncHandler(async (req, res) => {
    const submission = await requireActive(req.user.id, req.params.id);
    const results = await db.query(
      `SELECT sr.item_id, i.type, i.points, i.prompt_md,
              sr.points_awarded, sr.points_possible, sr.cases_total, sr.cases_passed,
              sr.needs_manual_review, sr.attempts
         FROM submission_results sr JOIN test_items i ON i.id = sr.item_id
        WHERE sr.submission_id = :id ORDER BY i.sort_order`,
      { id: submission.id },
    );
    res.json({
      status: submission.status,
      score: submission.score,
      maxScore: submission.max_score,
      submitCount: submission.submit_count,
      results,
    });
  }),
);

// GET /tests/:id/leaderboard
router.get(
  '/:id/leaderboard',
  asyncHandler(async (req, res) => {
    const test = await db.one(
      `SELECT id, show_leaderboard FROM tests WHERE id = :id AND is_published = 1`,
      { id: req.params.id },
    );
    if (!test) throw notFound('Test not found');
    const access = await db.one(
      `SELECT id FROM test_access WHERE test_id = :tid AND student_id = :sid`,
      { tid: test.id, sid: req.user.id },
    );
    if (!access) throw forbidden('You have not been assigned this test');
    if (!test.show_leaderboard) throw forbidden('The leaderboard is disabled for this test');

    const rows = await contest.leaderboard(test.id);
    res.json({ leaderboard: rows, me: req.user.id });
  }),
);

module.exports = router;

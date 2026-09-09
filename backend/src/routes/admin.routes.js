const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const db = require('../db');
const config = require('../config');
const { asyncHandler, notFound, badRequest, forbidden } = require('../utils/http');
const { authenticate, requireRole } = require('../middleware/auth');
const { body } = require('../utils/validate');
const accessCodes = require('../services/accessCode.service');
const grading = require('../services/grading.service');

const router = express.Router();
router.use(authenticate, requireRole('admin'));

/* ========================================================================== *
 *  Content manager — CRUD modules & lessons across all 8 tracks
 * ========================================================================== */

router.get('/tracks', asyncHandler(async (_req, res) => {
  res.json({ tracks: await db.query(`SELECT * FROM tracks ORDER BY sort_order, id`) });
}));

const moduleSchema = z.object({
  trackId: z.coerce.number().int().positive(),
  title: z.string().trim().min(1).max(160),
  summary: z.string().max(4000).optional(),
  sortOrder: z.coerce.number().int().default(0),
  isPublished: z.boolean().default(true),
});

router.get('/tracks/:trackId/modules', asyncHandler(async (req, res) => {
  const modules = await db.query(
    `SELECT * FROM modules WHERE track_id = :tid ORDER BY sort_order, id`,
    { tid: req.params.trackId },
  );
  res.json({ modules });
}));

router.post('/modules', body(moduleSchema), asyncHandler(async (req, res) => {
  const m = req.body;
  const r = await db.query(
    `INSERT INTO modules (track_id, title, summary, sort_order, is_published)
     VALUES (:trackId, :title, :summary, :sortOrder, :isPublished)`,
    { ...m, summary: m.summary ?? null, isPublished: m.isPublished ? 1 : 0 },
  );
  res.status(201).json({ id: r.insertId });
}));

router.put('/modules/:id', body(moduleSchema.partial()), asyncHandler(async (req, res) => {
  const fields = req.body;
  if (Object.keys(fields).length === 0) throw badRequest('No fields to update');
  const map = {
    trackId: 'track_id', title: 'title', summary: 'summary',
    sortOrder: 'sort_order', isPublished: 'is_published',
  };
  const sets = [];
  const params = { id: req.params.id };
  for (const [k, col] of Object.entries(map)) {
    if (fields[k] !== undefined) {
      sets.push(`${col} = :${k}`);
      params[k] = k === 'isPublished' ? (fields[k] ? 1 : 0) : fields[k];
    }
  }
  const r = await db.query(`UPDATE modules SET ${sets.join(', ')} WHERE id = :id`, params);
  if (r.affectedRows === 0) throw notFound('Module not found');
  res.json({ ok: true });
}));

router.delete('/modules/:id', asyncHandler(async (req, res) => {
  const r = await db.query(`DELETE FROM modules WHERE id = :id`, { id: req.params.id });
  if (r.affectedRows === 0) throw notFound('Module not found');
  res.json({ ok: true });
}));

const lessonSchema = z.object({
  moduleId: z.coerce.number().int().positive(),
  title: z.string().trim().min(1).max(160),
  bodyMd: z.string().min(1).max(2_000_000),
  sortOrder: z.coerce.number().int().default(0),
  isPublished: z.boolean().default(true),
});

router.get('/modules/:moduleId/lessons', asyncHandler(async (req, res) => {
  res.json({
    lessons: await db.query(
      `SELECT * FROM lessons WHERE module_id = :m ORDER BY sort_order, id`,
      { m: req.params.moduleId },
    ),
  });
}));

router.post('/lessons', body(lessonSchema), asyncHandler(async (req, res) => {
  const l = req.body;
  const r = await db.query(
    `INSERT INTO lessons (module_id, title, body_md, sort_order, is_published)
     VALUES (:moduleId, :title, :bodyMd, :sortOrder, :isPublished)`,
    { ...l, isPublished: l.isPublished ? 1 : 0 },
  );
  res.status(201).json({ id: r.insertId });
}));

router.put('/lessons/:id', body(lessonSchema.partial()), asyncHandler(async (req, res) => {
  const map = {
    moduleId: 'module_id', title: 'title', bodyMd: 'body_md',
    sortOrder: 'sort_order', isPublished: 'is_published',
  };
  const sets = []; const params = { id: req.params.id };
  for (const [k, col] of Object.entries(map)) {
    if (req.body[k] !== undefined) {
      sets.push(`${col} = :${k}`);
      params[k] = k === 'isPublished' ? (req.body[k] ? 1 : 0) : req.body[k];
    }
  }
  if (sets.length === 0) throw badRequest('No fields to update');
  const r = await db.query(`UPDATE lessons SET ${sets.join(', ')} WHERE id = :id`, params);
  if (r.affectedRows === 0) throw notFound('Lesson not found');
  res.json({ ok: true });
}));

router.delete('/lessons/:id', asyncHandler(async (req, res) => {
  const r = await db.query(`DELETE FROM lessons WHERE id = :id`, { id: req.params.id });
  if (r.affectedRows === 0) throw notFound('Lesson not found');
  res.json({ ok: true });
}));

/* ========================================================================== *
 *  Module "check your understanding" quizzes (part of course delivery)
 * ========================================================================== */

const mqMetaSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  passPercent: z.coerce.number().int().min(0).max(100).optional(),
  isPublished: z.boolean().optional(),
});
const mqQuestionSchema = z.object({
  promptMd: z.string().min(1).max(1_000_000),
  type: z.enum(['mcq', 'multi']).default('mcq'),
  explanationMd: z.string().max(8000).optional(),
  sortOrder: z.coerce.number().int().default(0),
  options: z.array(z.object({
    label: z.string().min(1).max(600),
    isCorrect: z.boolean().default(false),
    sortOrder: z.coerce.number().int().default(0),
  })).min(2),
});

// GET /admin/modules/:moduleId/quiz — full quiz incl. correct answers
router.get('/modules/:moduleId/quiz', asyncHandler(async (req, res) => {
  const quiz = await db.one(
    `SELECT * FROM module_quizzes WHERE module_id = :m`, { m: req.params.moduleId },
  );
  if (!quiz) return res.json({ quiz: null });
  const questions = await db.query(
    `SELECT * FROM module_quiz_questions WHERE quiz_id = :q ORDER BY sort_order, id`,
    { q: quiz.id },
  );
  const opts = questions.length
    ? await db.query(
      `SELECT * FROM module_quiz_options WHERE question_id IN (${questions.map(() => '?').join(',')}) ORDER BY sort_order, id`,
      questions.map((q) => q.id),
    )
    : [];
  res.json({
    quiz: {
      ...quiz,
      questions: questions.map((q) => ({
        ...q, options: opts.filter((o) => o.question_id === q.id),
      })),
    },
  });
}));

// PUT /admin/modules/:moduleId/quiz — create or update quiz metadata
router.put('/modules/:moduleId/quiz', body(mqMetaSchema), asyncHandler(async (req, res) => {
  const mod = await db.one(`SELECT id FROM modules WHERE id = :id`, { id: req.params.moduleId });
  if (!mod) throw notFound('Module not found');
  const { title = 'Check Your Understanding', passPercent = 70, isPublished = true } = req.body;
  await db.query(
    `INSERT INTO module_quizzes (module_id, title, pass_percent, is_published)
     VALUES (:m, :title, :pp, :pub)
     ON DUPLICATE KEY UPDATE title = VALUES(title),
       pass_percent = VALUES(pass_percent), is_published = VALUES(is_published)`,
    { m: req.params.moduleId, title, pp: passPercent, pub: isPublished ? 1 : 0 },
  );
  const quiz = await db.one(`SELECT * FROM module_quizzes WHERE module_id = :m`, { m: req.params.moduleId });
  res.json({ quiz });
}));

// POST /admin/modules/:moduleId/quiz/questions — add a question + its options
router.post('/modules/:moduleId/quiz/questions', body(mqQuestionSchema), asyncHandler(async (req, res) => {
  const q = req.body;
  if (!q.options.some((o) => o.isCorrect)) throw badRequest('Mark at least one option correct');
  if (q.type === 'mcq' && q.options.filter((o) => o.isCorrect).length !== 1) {
    throw badRequest('An mcq question needs exactly one correct option');
  }
  const id = await db.transaction(async (conn) => {
    let [quiz] = await conn.execute(
      `SELECT id FROM module_quizzes WHERE module_id = :m`, { m: req.params.moduleId },
    );
    let quizId = quiz[0] && quiz[0].id;
    if (!quizId) {
      const [ins] = await conn.execute(
        `INSERT INTO module_quizzes (module_id) VALUES (:m)`, { m: req.params.moduleId },
      );
      quizId = ins.insertId;
    }
    const [qi] = await conn.execute(
      `INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
       VALUES (:qid, :prompt, :type, :expl, :sort)`,
      {
        qid: quizId, prompt: q.promptMd, type: q.type,
        expl: q.explanationMd ?? null, sort: q.sortOrder,
      },
    );
    for (const o of q.options) {
      // eslint-disable-next-line no-await-in-loop
      await conn.execute(
        `INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order)
         VALUES (:q, :label, :correct, :sort)`,
        { q: qi.insertId, label: o.label, correct: o.isCorrect ? 1 : 0, sort: o.sortOrder },
      );
    }
    return qi.insertId;
  });
  res.status(201).json({ id });
}));

router.delete('/quiz-questions/:id', asyncHandler(async (req, res) => {
  const r = await db.query(`DELETE FROM module_quiz_questions WHERE id = :id`, { id: req.params.id });
  if (r.affectedRows === 0) throw notFound('Question not found');
  res.json({ ok: true });
}));

/* ========================================================================== *
 *  Test creator — build the test bank, set validity window
 * ========================================================================== */

const testSchema = z.object({
  trackId: z.coerce.number().int().positive(),
  title: z.string().trim().min(1).max(160),
  instructions: z.string().max(8000).optional(),
  opensAt: z.string().datetime().optional(),
  closesAt: z.string().datetime().optional(),
  durationMinutes: z.coerce.number().int().positive().optional(),
  isPublished: z.boolean().default(false),
});

router.get('/tests', asyncHandler(async (req, res) => {
  const tests = await db.query(
    `SELECT t.*, tr.title AS track_title, tr.kind AS track_kind
       FROM tests t JOIN tracks tr ON tr.id = t.track_id
      ORDER BY t.created_at DESC`,
  );
  res.json({ tests });
}));

router.post('/tests', body(testSchema), asyncHandler(async (req, res) => {
  const t = req.body;
  const r = await db.query(
    `INSERT INTO tests (track_id, title, instructions, opens_at, closes_at,
                        duration_minutes, is_published, created_by)
     VALUES (:trackId, :title, :instructions, :opensAt, :closesAt,
             :durationMinutes, :isPublished, :createdBy)`,
    {
      trackId: t.trackId, title: t.title, instructions: t.instructions ?? null,
      opensAt: t.opensAt ? new Date(t.opensAt) : null,
      closesAt: t.closesAt ? new Date(t.closesAt) : null,
      durationMinutes: t.durationMinutes ?? null,
      isPublished: t.isPublished ? 1 : 0, createdBy: req.user.id,
    },
  );
  res.status(201).json({ id: r.insertId });
}));

router.put('/tests/:id', body(testSchema.partial()), asyncHandler(async (req, res) => {
  const map = {
    trackId: 'track_id', title: 'title', instructions: 'instructions',
    opensAt: 'opens_at', closesAt: 'closes_at',
    durationMinutes: 'duration_minutes', isPublished: 'is_published',
  };
  const sets = []; const params = { id: req.params.id };
  for (const [k, col] of Object.entries(map)) {
    if (req.body[k] === undefined) continue;
    sets.push(`${col} = :${k}`);
    if (k === 'isPublished') params[k] = req.body[k] ? 1 : 0;
    else if (k === 'opensAt' || k === 'closesAt') params[k] = req.body[k] ? new Date(req.body[k]) : null;
    else params[k] = req.body[k];
  }
  if (sets.length === 0) throw badRequest('No fields to update');
  const r = await db.query(`UPDATE tests SET ${sets.join(', ')} WHERE id = :id`, params);
  if (r.affectedRows === 0) throw notFound('Test not found');
  res.json({ ok: true });
}));

router.delete('/tests/:id', asyncHandler(async (req, res) => {
  const r = await db.query(`DELETE FROM tests WHERE id = :id`, { id: req.params.id });
  if (r.affectedRows === 0) throw notFound('Test not found');
  res.json({ ok: true });
}));

// --- test items (questions) + options + cases -------------------------------

const itemSchema = z.object({
  type: z.enum(['coding', 'mcq', 'short_answer', 'query']),
  promptMd: z.string().min(1).max(1_000_000),
  points: z.coerce.number().int().positive().default(1),
  sortOrder: z.coerce.number().int().default(0),
  starterCode: z.string().max(500000).optional(),
  expectedAnswer: z.string().max(500000).optional(),
  gradingMode: z.enum(['auto_exact', 'auto_judge', 'manual']).optional(),
  options: z.array(z.object({
    label: z.string().min(1).max(500),
    isCorrect: z.boolean().default(false),
    sortOrder: z.coerce.number().int().default(0),
  })).optional(),
  cases: z.array(z.object({
    stdin: z.string().max(200000),
    expectedStdout: z.string().max(200000),
    isSample: z.boolean().default(false),
    weight: z.coerce.number().int().positive().default(1),
    sortOrder: z.coerce.number().int().default(0),
  })).optional(),
});

router.get('/tests/:id/items', asyncHandler(async (req, res) => {
  const items = await db.query(
    `SELECT * FROM test_items WHERE test_id = :tid ORDER BY sort_order, id`,
    { tid: req.params.id },
  );
  const ids = items.map((i) => i.id);
  const options = ids.length
    ? await db.query(`SELECT * FROM test_item_options WHERE item_id IN (${ids.map(() => '?').join(',')}) ORDER BY sort_order`, ids)
    : [];
  const cases = ids.length
    ? await db.query(`SELECT * FROM test_cases WHERE item_id IN (${ids.map(() => '?').join(',')}) ORDER BY sort_order`, ids)
    : [];
  res.json({
    items: items.map((it) => ({
      ...it,
      options: options.filter((o) => o.item_id === it.id),
      cases: cases.filter((c) => c.item_id === it.id),
    })),
  });
}));

router.post('/tests/:id/items', body(itemSchema), asyncHandler(async (req, res) => {
  const it = req.body;
  const test = await db.one(`SELECT * FROM tests WHERE id = :id`, { id: req.params.id });
  if (!test) throw notFound('Test not found');

  const id = await db.transaction(async (conn) => {
    const [ins] = await conn.execute(
      `INSERT INTO test_items (test_id, type, prompt_md, points, sort_order,
                               starter_code, expected_answer, grading_mode)
       VALUES (:tid, :type, :prompt, :points, :sort, :starter, :expected, :grading)`,
      {
        tid: req.params.id, type: it.type, prompt: it.promptMd, points: it.points,
        sort: it.sortOrder, starter: it.starterCode ?? null,
        expected: it.expectedAnswer ?? null, grading: it.gradingMode ?? null,
      },
    );
    const itemId = ins.insertId;
    for (const o of it.options ?? []) {
      // eslint-disable-next-line no-await-in-loop
      await conn.execute(
        `INSERT INTO test_item_options (item_id, label, is_correct, sort_order)
         VALUES (:iid, :label, :correct, :sort)`,
        { iid: itemId, label: o.label, correct: o.isCorrect ? 1 : 0, sort: o.sortOrder },
      );
    }
    for (const c of it.cases ?? []) {
      // eslint-disable-next-line no-await-in-loop
      await conn.execute(
        `INSERT INTO test_cases (item_id, stdin, expected_stdout, is_sample, weight, sort_order)
         VALUES (:iid, :stdin, :expected, :sample, :weight, :sort)`,
        {
          iid: itemId, stdin: c.stdin, expected: c.expectedStdout,
          sample: c.isSample ? 1 : 0, weight: c.weight, sort: c.sortOrder,
        },
      );
    }
    await conn.execute(
      `UPDATE tests SET total_points = (SELECT COALESCE(SUM(points),0) FROM test_items WHERE test_id = :tid)
       WHERE id = :tid`,
      { tid: req.params.id },
    );
    return itemId;
  });
  res.status(201).json({ id });
}));

router.delete('/items/:itemId', asyncHandler(async (req, res) => {
  const r = await db.query(`DELETE FROM test_items WHERE id = :id`, { id: req.params.itemId });
  if (r.affectedRows === 0) throw notFound('Item not found');
  res.json({ ok: true });
}));

/* ========================================================================== *
 *  Access codes — generate & export unique, time-limited, one-time codes
 * ========================================================================== */

const genSchema = z.object({
  studentIds: z.array(z.coerce.number().int().positive()).min(1),
  expiresAt: z.string().datetime(),
});

// POST /admin/tests/:id/access-codes -> generates codes, returns plaintext ONCE
router.post('/tests/:id/access-codes', body(genSchema), asyncHandler(async (req, res) => {
  const test = await db.one(`SELECT * FROM tests WHERE id = :id`, { id: req.params.id });
  if (!test) throw notFound('Test not found');
  const expiresAt = new Date(req.body.expiresAt);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
    throw badRequest('expiresAt must be a future date');
  }

  const students = await db.query(
    `SELECT id, roll_number, full_name FROM users
      WHERE role = 'student' AND id IN (${req.body.studentIds.map(() => '?').join(',')})`,
    req.body.studentIds,
  );
  const byId = Object.fromEntries(students.map((s) => [s.id, s]));

  const issued = [];
  for (const studentId of req.body.studentIds) {
    if (!byId[studentId]) continue;
    // eslint-disable-next-line no-await-in-loop
    const { code } = await accessCodes.generate({
      testId: test.id, studentId, adminId: req.user.id, expiresAt,
    });
    issued.push({
      studentId,
      rollNumber: byId[studentId].roll_number,
      fullName: byId[studentId].full_name,
      code,
      expiresAt,
    });
  }
  res.json({ testId: test.id, testTitle: test.title, expiresAt, codes: issued });
}));

// GET /admin/tests/:id/access-codes -> status only (no plaintext, it's gone)
router.get('/tests/:id/access-codes', asyncHandler(async (req, res) => {
  const rows = await db.query(
    `SELECT ta.student_id, u.roll_number, u.full_name, ta.code_last4,
            ta.expires_at, ta.used_at, ta.revoked_at, ta.created_at
       FROM test_access ta JOIN users u ON u.id = ta.student_id
      WHERE ta.test_id = :tid ORDER BY u.roll_number`,
    { tid: req.params.id },
  );
  res.json({ codes: rows });
}));

router.post('/tests/:id/access-codes/:studentId/revoke', asyncHandler(async (req, res) => {
  await accessCodes.revoke({ testId: req.params.id, studentId: req.params.studentId });
  res.json({ ok: true });
}));

/* ========================================================================== *
 *  Reports — progress % per track, test scores, filterable
 * ========================================================================== */

router.get('/reports/progress', asyncHandler(async (req, res) => {
  const { studentId, trackId } = req.query;
  const where = [];
  const params = {};
  if (studentId) { where.push('student_id = :studentId'); params.studentId = studentId; }
  if (trackId) { where.push('track_id = :trackId'); params.trackId = trackId; }
  const rows = await db.query(
    `SELECT * FROM v_track_progress
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY full_name, track_title`,
    params,
  );
  res.json({ rows });
}));

router.get('/reports/scores', asyncHandler(async (req, res) => {
  const { studentId, trackId, testId } = req.query;
  const where = ['s.status IN ("submitted","graded")'];
  const params = {};
  if (studentId) { where.push('s.student_id = :studentId'); params.studentId = studentId; }
  if (trackId) { where.push('t.track_id = :trackId'); params.trackId = trackId; }
  if (testId) { where.push('s.test_id = :testId'); params.testId = testId; }
  const rows = await db.query(
    `SELECT s.id AS submission_id, u.roll_number, u.full_name,
            tr.title AS track_title, t.title AS test_title,
            s.status, s.score, s.max_score, s.submitted_at, s.graded_at,
            EXISTS(SELECT 1 FROM submission_results sr
                    WHERE sr.submission_id = s.id AND sr.needs_manual_review = 1) AS needs_review
       FROM submissions s
       JOIN users u  ON u.id = s.student_id
       JOIN tests t  ON t.id = s.test_id
       JOIN tracks tr ON tr.id = t.track_id
      WHERE ${where.join(' AND ')}
      ORDER BY s.submitted_at DESC`,
    params,
  );
  res.json({ rows });
}));

// GET /admin/reports/module-quizzes -> per-student module quiz results
router.get('/reports/module-quizzes', asyncHandler(async (req, res) => {
  const { studentId, trackId } = req.query;
  const where = [];
  const params = {};
  if (studentId) { where.push('a.student_id = :studentId'); params.studentId = studentId; }
  if (trackId) { where.push('m.track_id = :trackId'); params.trackId = trackId; }
  const rows = await db.query(
    `SELECT u.roll_number, u.full_name, tr.title AS track_title,
            m.title AS module_title, q.title AS quiz_title,
            a.score, a.max_score, a.percent, a.passed, a.attempts, a.updated_at
       FROM module_quiz_attempts a
       JOIN users u ON u.id = a.student_id
       JOIN module_quizzes q ON q.id = a.quiz_id
       JOIN modules m ON m.id = q.module_id
       JOIN tracks tr ON tr.id = m.track_id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY u.full_name, tr.title, m.sort_order`,
    params,
  );
  res.json({ rows });
}));

// GET /admin/submissions/:id -> full per-item detail for manual review
router.get('/submissions/:id', asyncHandler(async (req, res) => {
  const submission = await db.one(
    `SELECT s.*, u.roll_number, u.full_name, t.title AS test_title
       FROM submissions s JOIN users u ON u.id = s.student_id
       JOIN tests t ON t.id = s.test_id WHERE s.id = :id`,
    { id: req.params.id },
  );
  if (!submission) throw notFound('Submission not found');
  const results = await db.query(
    `SELECT sr.*, i.type, i.prompt_md, i.points
       FROM submission_results sr JOIN test_items i ON i.id = sr.item_id
      WHERE sr.submission_id = :id ORDER BY i.sort_order`,
    { id: req.params.id },
  );
  res.json({ submission, results });
}));

const reviewSchema = z.object({
  items: z.array(z.object({
    resultId: z.coerce.number().int().positive(),
    pointsAwarded: z.coerce.number().int().min(0),
  })).min(1),
});

// POST /admin/submissions/:id/review -> set manual scores, recompute total
router.post('/submissions/:id/review', body(reviewSchema), asyncHandler(async (req, res) => {
  await db.transaction(async (conn) => {
    for (const it of req.body.items) {
      // eslint-disable-next-line no-await-in-loop
      await conn.execute(
        `UPDATE submission_results
            SET points_awarded = :pa, needs_manual_review = 0, graded_at = CURRENT_TIMESTAMP
          WHERE id = :id AND submission_id = :sid`,
        { pa: it.pointsAwarded, id: it.resultId, sid: req.params.id },
      );
    }
    await conn.execute(
      `UPDATE submissions s
          SET score = (SELECT COALESCE(SUM(points_awarded),0) FROM submission_results WHERE submission_id = s.id),
              max_score = (SELECT COALESCE(SUM(points_possible),0) FROM submission_results WHERE submission_id = s.id),
              status = 'graded', graded_at = CURRENT_TIMESTAMP
        WHERE s.id = :id`,
      { id: req.params.id },
    );
  });
  res.json({ ok: true });
}));

// POST /admin/submissions/:id/regrade -> re-run auto grading
router.post('/submissions/:id/regrade', asyncHandler(async (req, res) => {
  const grade = await grading.gradeSubmission(req.params.id);
  res.json(grade);
}));

/* --- students list (for assigning codes / filtering reports) --------------- */
router.get('/students', asyncHandler(async (_req, res) => {
  const rows = await db.query(
    `SELECT id, roll_number, full_name, email, is_active FROM users
      WHERE role = 'student' ORDER BY roll_number`,
  );
  res.json({ students: rows });
}));

/* ========================================================================== *
 *  People — create and manage student and admin accounts
 * ========================================================================== */

function publicUser(u) {
  return {
    id: u.id, role: u.role, fullName: u.full_name,
    username: u.username, rollNumber: u.roll_number, email: u.email,
    isActive: !!u.is_active, createdAt: u.created_at,
  };
}

router.get('/users', asyncHandler(async (req, res) => {
  const rows = await db.query(
    `SELECT id, role, username, roll_number, full_name, email, is_active, created_at
       FROM users ORDER BY role, COALESCE(username, roll_number)`,
  );
  res.json({ users: rows.map(publicUser) });
}));

const createUserSchema = z.object({
  role: z.enum(['student', 'admin']),
  fullName: z.string().trim().min(1).max(120),
  username: z.string().trim().min(1).max(64).optional(),
  rollNumber: z.string().trim().min(1).max(32).optional(),
  email: z.string().trim().toLowerCase().email().max(190).optional().or(z.literal('')),
  password: z.string().min(6).max(200),
  isActive: z.boolean().default(true),
}).superRefine((d, ctx) => {
  if (d.role === 'admin' && !d.username) {
    ctx.addIssue({ code: 'custom', path: ['username'], message: 'Username is required for an admin' });
  }
  if (d.role === 'student' && !d.rollNumber) {
    ctx.addIssue({ code: 'custom', path: ['rollNumber'], message: 'Roll number is required for a student' });
  }
});

router.post('/users', body(createUserSchema), asyncHandler(async (req, res) => {
  const d = req.body;
  const hash = await bcrypt.hash(d.password, config.bcryptRounds);
  const r = await db.query(
    `INSERT INTO users (role, username, roll_number, full_name, email, password_hash, is_active)
     VALUES (:role, :username, :roll, :name, :email, :hash, :active)`,
    {
      role: d.role,
      username: d.role === 'admin' ? d.username : null,
      roll: d.role === 'student' ? d.rollNumber : null,
      name: d.fullName,
      email: d.email || null,
      hash,
      active: d.isActive ? 1 : 0,
    },
  );
  const row = await db.one(
    `SELECT id, role, username, roll_number, full_name, email, is_active, created_at
       FROM users WHERE id = :id`, { id: r.insertId },
  );
  res.status(201).json({ user: publicUser(row) });
}));

const updateUserSchema = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().toLowerCase().email().max(190).optional().or(z.literal('')),
  password: z.string().min(6).max(200).optional(),
  isActive: z.boolean().optional(),
});

router.patch('/users/:id', body(updateUserSchema), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const target = await db.one(`SELECT * FROM users WHERE id = :id`, { id });
  if (!target) throw notFound('User not found');
  if (id === req.user.id && req.body.isActive === false) {
    throw forbidden('You cannot deactivate your own account');
  }

  const sets = [];
  const params = { id };
  if (req.body.fullName !== undefined) { sets.push('full_name = :name'); params.name = req.body.fullName; }
  if (req.body.email !== undefined) { sets.push('email = :email'); params.email = req.body.email || null; }
  if (req.body.isActive !== undefined) { sets.push('is_active = :active'); params.active = req.body.isActive ? 1 : 0; }
  if (req.body.password !== undefined) {
    sets.push('password_hash = :hash');
    params.hash = await bcrypt.hash(req.body.password, config.bcryptRounds);
  }
  if (sets.length === 0) throw badRequest('Nothing to update');

  await db.query(`UPDATE users SET ${sets.join(', ')} WHERE id = :id`, params);
  const row = await db.one(
    `SELECT id, role, username, roll_number, full_name, email, is_active, created_at
       FROM users WHERE id = :id`, { id },
  );
  res.json({ user: publicUser(row) });
}));

module.exports = router;

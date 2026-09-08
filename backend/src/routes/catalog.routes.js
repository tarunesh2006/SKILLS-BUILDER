const express = require('express');
const db = require('../db');
const { asyncHandler, notFound } = require('../utils/http');
const { authenticate } = require('../middleware/auth');

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
    if (req.user.role === 'student') {
      const rows = await db.query(
        `SELECT module_id, status, completed_at FROM progress WHERE student_id = :sid`,
        { sid: req.user.id },
      );
      progressByModule = Object.fromEntries(rows.map((r) => [r.module_id, r]));
    }

    res.json({
      track,
      modules: modules.map((m) => ({
        ...m,
        lessons: lessons.filter((l) => l.module_id === m.id)
          .map(({ module_id, ...rest }) => rest),
        progress: progressByModule[m.id] || { status: 'not_started' },
      })),
    });
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

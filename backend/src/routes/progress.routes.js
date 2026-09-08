const express = require('express');
const { z } = require('zod');
const db = require('../db');
const { asyncHandler, notFound } = require('../utils/http');
const { authenticate, requireRole } = require('../middleware/auth');
const { body } = require('../utils/validate');

const router = express.Router();
router.use(authenticate, requireRole('student'));

const setStatus = z.object({
  status: z.enum(['not_started', 'in_progress', 'completed']),
});

// GET /progress — this student's progress across all tracks (from the view)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await db.query(
      `SELECT track_id, track_slug, track_title, modules_total, modules_completed, percent_complete
         FROM v_track_progress WHERE student_id = :sid
        ORDER BY track_title`,
      { sid: req.user.id },
    );
    res.json({ tracks: rows });
  }),
);

// PUT /progress/modules/:moduleId — mark a module's completion state
router.put(
  '/modules/:moduleId',
  body(setStatus),
  asyncHandler(async (req, res) => {
    const mod = await db.one(`SELECT id FROM modules WHERE id = :id`, { id: req.params.moduleId });
    if (!mod) throw notFound('Module not found');

    const completedAt = req.body.status === 'completed' ? new Date() : null;
    await db.query(
      `INSERT INTO progress (student_id, module_id, status, completed_at)
       VALUES (:sid, :mid, :status, :completedAt)
       ON DUPLICATE KEY UPDATE status = VALUES(status), completed_at = VALUES(completed_at)`,
      { sid: req.user.id, mid: req.params.moduleId, status: req.body.status, completedAt },
    );
    const row = await db.one(
      `SELECT module_id, status, completed_at FROM progress WHERE student_id = :sid AND module_id = :mid`,
      { sid: req.user.id, mid: req.params.moduleId },
    );
    res.json({ progress: row });
  }),
);

module.exports = router;

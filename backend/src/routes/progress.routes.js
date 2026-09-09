const express = require('express');
const db = require('../db');
const { asyncHandler } = require('../utils/http');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireRole('student'));

// GET /progress — this student's progress across all tracks (from the view).
// Module status is derived automatically from lesson views + quiz results
// (see services/progress.service.js); there is no manual "mark complete".
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

module.exports = router;

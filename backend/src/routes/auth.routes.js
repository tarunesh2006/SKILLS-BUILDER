const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const db = require('../db');
const config = require('../config');
const { asyncHandler, unauthorized, badRequest, conflict } = require('../utils/http');
const { body } = require('../utils/validate');
const { signToken, authenticate } = require('../middleware/auth');
const google = require('../services/googleAuth.service');

const router = express.Router();

// Students sign in with Google (or, as a hidden fallback, email / roll number).
const studentLogin = z.object({
  email: z.string().trim().toLowerCase().email().max(190).optional(),
  rollNumber: z.string().trim().min(1).max(32).optional(),
  password: z.string().min(1).max(200),
}).refine((d) => d.email || d.rollNumber, {
  message: 'Provide an email address or a roll number',
  path: ['email'],
});
const adminLogin = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(200),
});

async function authenticateUser(where, params, password) {
  const user = await db.one(
    `SELECT * FROM users WHERE ${where} AND is_active = 1 LIMIT 1`,
    params,
  );
  if (!user) throw unauthorized('Invalid credentials');
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw unauthorized('Invalid credentials');
  return user;
}

const needsProfile = (u) => u.role === 'student' && (!u.username || !u.roll_number);

function publicUser(u) {
  return {
    id: u.id, role: u.role, fullName: u.full_name,
    rollNumber: u.roll_number, username: u.username, email: u.email,
    needsProfile: needsProfile(u),
  };
}

// --- Google sign-in (students) ---------------------------------------------
router.post(
  '/google',
  body(z.object({ credential: z.string().min(20) })),
  asyncHandler(async (req, res) => {
    const g = await google.verifyIdToken(req.body.credential);

    let user = await db.one(
      `SELECT * FROM users WHERE google_sub = :sub OR (email = :email AND role = 'student') LIMIT 1`,
      { sub: g.sub, email: g.email },
    );

    if (user && user.role !== 'student') {
      throw unauthorized('This Google account belongs to an admin — sign in on the Admin tab');
    }

    if (!user) {
      const randomHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), config.bcryptRounds);
      const r = await db.query(
        `INSERT INTO users (role, full_name, email, google_sub, password_hash, is_active)
         VALUES ('student', :name, :email, :sub, :hash, 1)`,
        { name: g.name, email: g.email, sub: g.sub, hash: randomHash },
      );
      user = await db.one(`SELECT * FROM users WHERE id = :id`, { id: r.insertId });
    } else if (!user.google_sub) {
      await db.query(`UPDATE users SET google_sub = :sub WHERE id = :id`, { sub: g.sub, id: user.id });
      user.google_sub = g.sub;
    }
    if (!user.is_active) throw unauthorized('This account has been disabled');

    res.json({ token: signToken(user), user: publicUser(user) });
  }),
);

// --- complete profile after first Google login (username + roll number) ---
router.put(
  '/profile',
  authenticate,
  body(z.object({
    username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9._-]+$/,
      'Letters, digits, dot, underscore and hyphen only'),
    rollNumber: z.string().trim().min(1).max(32),
  })),
  asyncHandler(async (req, res) => {
    if (req.user.role !== 'student') throw badRequest('Only students set a roll number');
    const { username, rollNumber } = req.body;

    const clash = await db.one(
      `SELECT id, username, roll_number FROM users
        WHERE id <> :id AND (username = :username OR roll_number = :roll) LIMIT 1`,
      { id: req.user.id, username, roll: rollNumber },
    );
    if (clash) {
      throw conflict(clash.username === username
        ? 'That username is taken'
        : 'That roll number is already registered');
    }

    await db.query(
      `UPDATE users SET username = :username, roll_number = :roll WHERE id = :id`,
      { username, roll: rollNumber, id: req.user.id },
    );
    const user = await db.one(`SELECT * FROM users WHERE id = :id`, { id: req.user.id });
    res.json({ user: publicUser(user) });
  }),
);

// --- student email / roll number + password (hidden fallback) -------------
router.post(
  '/student/login',
  body(studentLogin),
  asyncHandler(async (req, res) => {
    if (!config.allowPasswordLogin) {
      throw unauthorized('Password sign-in is disabled — use Google');
    }
    const { email, rollNumber, password } = req.body;
    const [column, value] = email ? ['email', email] : ['roll_number', rollNumber];
    const user = await authenticateUser(
      `role = 'student' AND ${column} = :value`,
      { value },
      password,
    );
    res.json({ token: signToken(user), user: publicUser(user) });
  }),
);

// --- admin login (username + password) ----------------------------------
router.post(
  '/admin/login',
  body(adminLogin),
  asyncHandler(async (req, res) => {
    const user = await authenticateUser(
      `role = 'admin' AND username = :username`,
      { username: req.body.username },
      req.body.password,
    );
    res.json({ token: signToken(user), user: publicUser(user) });
  }),
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await db.one(`SELECT * FROM users WHERE id = :id`, { id: req.user.id });
    if (!user) throw unauthorized();
    res.json({ user: publicUser(user) });
  }),
);

// tells the frontend whether to show the Google button
router.get('/config', (_req, res) => {
  res.json({
    googleClientId: config.google.clientId || null,
    passwordLoginEnabled: config.allowPasswordLogin,
  });
});

module.exports = router;

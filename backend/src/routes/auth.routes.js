const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const db = require('../db');
const { asyncHandler, unauthorized } = require('../utils/http');
const { body } = require('../utils/validate');
const { signToken, authenticate } = require('../middleware/auth');

const router = express.Router();

// Students sign in with their university email or their roll number.
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

function publicUser(u) {
  return {
    id: u.id, role: u.role, fullName: u.full_name,
    rollNumber: u.roll_number, username: u.username, email: u.email,
  };
}

// Student login: university email (or roll number) + password
router.post(
  '/student/login',
  body(studentLogin),
  asyncHandler(async (req, res) => {
    const { email, rollNumber, password } = req.body;
    const [column, value] = email
      ? ['email', email]
      : ['roll_number', rollNumber];
    const user = await authenticateUser(
      `role = 'student' AND ${column} = :value`,
      { value },
      password,
    );
    res.json({ token: signToken(user), user: publicUser(user) });
  }),
);

// Admin login: restricted access
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

module.exports = router;

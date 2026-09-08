/**
 * Test access codes: unique, time-limited, one-time-use passwords that the admin
 * generates per student per test. Separate from normal login.
 *
 * Only a bcrypt hash of each code is stored. The plaintext is returned once at
 * generation time so the admin can export/hand it to the student.
 */
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const config = require('../config');
const db = require('../db');
const { badRequest, forbidden } = require('../utils/http');

// Unambiguous alphabet (no 0/O/1/I/L).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomCode(len = 10) {
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i += 1) out += ALPHABET[bytes[i] % ALPHABET.length];
  // group as XXXXX-XXXXX for readability
  return out.replace(new RegExp(`(.{${Math.ceil(len / 2)}})(.+)`), '$1-$2');
}

/**
 * Create (or regenerate) an access code for one student+test.
 * Returns { studentId, code, expiresAt }. Existing unused codes are replaced.
 */
async function generate({ testId, studentId, adminId, expiresAt }) {
  const code = randomCode(10);
  const hash = await bcrypt.hash(code, config.bcryptRounds);
  const last4 = code.replace('-', '').slice(-4);

  await db.query(
    `INSERT INTO test_access (test_id, student_id, code_hash, code_last4, expires_at, created_by)
     VALUES (:testId, :studentId, :hash, :last4, :expiresAt, :adminId)
     ON DUPLICATE KEY UPDATE
       code_hash = VALUES(code_hash),
       code_last4 = VALUES(code_last4),
       expires_at = VALUES(expires_at),
       used_at = NULL,
       revoked_at = NULL,
       created_by = VALUES(created_by),
       created_at = CURRENT_TIMESTAMP`,
    { testId, studentId, hash, last4, expiresAt, adminId },
  );

  return { studentId, code, expiresAt };
}

/**
 * Verify a code a student typed for a test. On success, marks it used (one-time)
 * and returns the test_access row id. Throws 403 otherwise.
 */
async function redeem({ testId, studentId, code }) {
  const row = await db.one(
    `SELECT * FROM test_access WHERE test_id = :testId AND student_id = :studentId`,
    { testId, studentId },
  );
  if (!row) throw forbidden('No access code has been issued to you for this test');
  if (row.revoked_at) throw forbidden('This access code has been revoked');
  if (row.used_at) throw forbidden('This access code has already been used');
  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw forbidden('This access code has expired');
  }

  const ok = await bcrypt.compare(String(code || '').trim().toUpperCase(), row.code_hash);
  if (!ok) throw forbidden('Incorrect access code');

  const res = await db.query(
    `UPDATE test_access SET used_at = CURRENT_TIMESTAMP
     WHERE id = :id AND used_at IS NULL`,
    { id: row.id },
  );
  if (res.affectedRows === 0) throw forbidden('This access code has already been used');

  return row.id;
}

async function revoke({ testId, studentId }) {
  const res = await db.query(
    `UPDATE test_access SET revoked_at = CURRENT_TIMESTAMP
     WHERE test_id = :testId AND student_id = :studentId AND used_at IS NULL`,
    { testId, studentId },
  );
  if (res.affectedRows === 0) {
    throw badRequest('Nothing to revoke (code missing or already used)');
  }
}

module.exports = { generate, redeem, revoke, randomCode };

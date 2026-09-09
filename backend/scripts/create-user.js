/**
 * Create (or update) a platform user from the command line.
 *
 *   # new admin
 *   npm run create-admin -- --username jane --name "Jane Doe" --password 's3cret!'
 *
 *   # new student
 *   npm run create-student -- --roll S010 --name "Sam Lee" --email sam@uni.edu --password 'pw'
 *
 * Flags:
 *   --role admin|student   (set for you by the npm script)
 *   --username <u>         admin login name        (admins)
 *   --roll <r>             roll number             (students)
 *   --name  <full name>    required
 *   --email <e>            optional (students sign in with email too)
 *   --password <p>         optional — if omitted a strong one is generated
 *                          and printed once
 *   --inactive            create the account disabled
 *
 * A user that already exists (same username / roll number / email) is updated,
 * including the password.
 */
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../src/db');
const config = require('../src/config');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}

function randomPassword(len = 14) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789#$%@';
  const bytes = crypto.randomBytes(len);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const role = args.role;
  const name = args.name;
  const email = args.email || null;
  let password = args.password || process.env.USER_PASSWORD;
  const isActive = args.inactive ? 0 : 1;

  if (role !== 'admin' && role !== 'student') {
    throw new Error('--role must be admin or student');
  }
  if (!name) throw new Error('--name is required');

  const username = role === 'admin' ? args.username : null;
  const rollNumber = role === 'student' ? args.roll : null;
  if (role === 'admin' && !username) throw new Error('--username is required for an admin');
  if (role === 'student' && !rollNumber) throw new Error('--roll is required for a student');

  let generated = false;
  if (!password) {
    password = randomPassword();
    generated = true;
  }
  if (password.length < 6) throw new Error('password must be at least 6 characters');

  const hash = await bcrypt.hash(password, config.bcryptRounds);

  await db.query(
    `INSERT INTO users (role, username, roll_number, full_name, email, password_hash, is_active)
     VALUES (:role, :username, :roll, :name, :email, :hash, :active)
     ON DUPLICATE KEY UPDATE
       full_name = VALUES(full_name),
       email = VALUES(email),
       password_hash = VALUES(password_hash),
       is_active = VALUES(is_active)`,
    { role, username, roll: rollNumber, name, email, hash, active: isActive },
  );

  const identifier = role === 'admin' ? `username "${username}"` : `roll "${rollNumber}"`;
  console.log(`\n  ${role} ready — ${identifier}, name "${name}"${email ? `, email ${email}` : ''}`);
  if (generated) {
    console.log(`  generated password:  ${password}`);
    console.log('  (this is shown once — copy it now)');
  } else {
    console.log('  password set as provided');
  }
  console.log('');

  await db.pool.end();
}

main().catch((e) => {
  console.error(`\n  error: ${e.message}\n`);
  process.exit(1);
});

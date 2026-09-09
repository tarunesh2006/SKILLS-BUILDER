/**
 * Seeds the admin account and a handful of demo students with hashed passwords.
 * Content (tracks/modules/lessons) is seeded by db/seed.sql.
 *
 *   npm run seed
 */
const bcrypt = require('bcryptjs');
const db = require('../src/db');
const config = require('../src/config');

const STUDENTS = [
  { roll: 'S001', name: 'Asha Rao',      email: 'asha@example.edu',   username: 'asha.rao' },
  { roll: 'S002', name: 'Ben Carter',    email: 'ben@example.edu',    username: 'ben.carter' },
  { roll: 'S003', name: 'Chitra Menon',  email: 'chitra@example.edu', username: 'chitra.menon' },
];

async function upsertUser(row) {
  await db.query(
    `INSERT INTO users (role, roll_number, username, full_name, email, password_hash)
     VALUES (:role, :roll, :username, :name, :email, :hash)
     ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), email = VALUES(email),
                             username = VALUES(username),
                             password_hash = VALUES(password_hash), is_active = 1`,
    row,
  );
}

async function main() {
  const adminHash = await bcrypt.hash(config.seed.adminPassword, config.bcryptRounds);
  await upsertUser({
    role: 'admin', roll: null, username: config.seed.adminUsername,
    name: 'Platform Admin', email: null, hash: adminHash,
  });
  console.log(`admin: ${config.seed.adminUsername} / ${config.seed.adminPassword}`);

  const studentHash = await bcrypt.hash(config.seed.studentPassword, config.bcryptRounds);
  for (const s of STUDENTS) {
    // eslint-disable-next-line no-await-in-loop
    await upsertUser({
      role: 'student', roll: s.roll, username: s.username,
      name: s.name, email: s.email, hash: studentHash,
    });
    console.log(`student: ${s.roll} / ${config.seed.studentPassword}`);
  }

  await db.pool.end();
  console.log('done');
}

main().catch((e) => { console.error(e); process.exit(1); });

require('dotenv').config();

function req(name, fallback) {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing required env var: ${name}`);
  return v;
}

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),

  db: {
    host: req('DB_HOST', '127.0.0.1'),
    port: Number(req('DB_PORT', '3306')),
    user: req('DB_USER', 'root'),
    password: req('DB_PASSWORD', 'root'),
    database: req('DB_NAME', 'learning_platform'),
    connectionLimit: 10,
  },

  jwt: {
    secret: req('JWT_SECRET', 'dev-insecure-secret'),
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },

  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 10),

  judge: {
    url: req('JUDGE_URL', 'http://127.0.0.1:2000'),
    runTimeoutMs: Number(process.env.JUDGE_RUN_TIMEOUT_MS || 8000),
    compileTimeoutMs: Number(process.env.JUDGE_COMPILE_TIMEOUT_MS || 10000),
  },

  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',').map((s) => s.trim()).filter(Boolean),

  seed: {
    adminUsername: process.env.SEED_ADMIN_USERNAME || 'admin',
    adminPassword: process.env.SEED_ADMIN_PASSWORD || 'admin123',
    studentPassword: process.env.SEED_STUDENT_PASSWORD || 'student123',
  },
};

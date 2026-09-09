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

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    // clientSecret is only needed for the auth-code flow; the ID-token (button)
    // flow verifies against Google's public keys and just needs the client id.
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },
  // hidden fallback: student email/roll + password login. Off by default.
  allowPasswordLogin: process.env.ALLOW_PASSWORD_LOGIN !== 'false',

  // AI question author. Points at a LOCAL model server by default (Ollama) so
  // no API key is needed. Set AI_API_STYLE=openai + AI_BASE_URL + AI_API_KEY to
  // use an OpenAI-compatible endpoint instead.
  ai: {
    style: process.env.AI_API_STYLE || 'ollama', // 'ollama' | 'openai'
    baseUrl: (process.env.AI_BASE_URL || 'http://localhost:11434').replace(/\/$/, ''),
    model: process.env.AI_MODEL || 'qwen2.5-coder:7b',
    apiKey: process.env.AI_API_KEY || '',
    timeoutMs: Number(process.env.AI_TIMEOUT_MS || 120000),
  },

  seed: {
    adminUsername: process.env.SEED_ADMIN_USERNAME || 'admin',
    adminPassword: process.env.SEED_ADMIN_PASSWORD || 'admin123',
    studentPassword: process.env.SEED_STUDENT_PASSWORD || 'student123',
  },
};

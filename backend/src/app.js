const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { errorHandler, notFoundHandler } = require('./middleware/error');

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: false }));
app.use(express.json({ limit: '2mb' }));
if (config.env !== 'test') app.use(morgan('dev'));

// Tighter limit on auth + test-unlock endpoints (access-code brute force).
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true });
app.use('/api/auth', authLimiter);
app.use(/^\/api\/tests\/\d+\/unlock$/, authLimiter);

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/catalog', require('./routes/catalog.routes'));
app.use('/api/progress', require('./routes/progress.routes'));
app.use('/api/tests', require('./routes/tests.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

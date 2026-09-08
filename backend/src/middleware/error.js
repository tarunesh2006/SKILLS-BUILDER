const { ApiError } = require('../utils/http');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // MySQL duplicate key
  if (err && err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Duplicate entry' });
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}

function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Route not found' });
}

module.exports = { errorHandler, notFoundHandler };

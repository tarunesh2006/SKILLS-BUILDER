const jwt = require('jsonwebtoken');
const config = require('../config');
const { unauthorized, forbidden } = require('../utils/http');

/** Sign a session token for a user row. */
function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, name: user.full_name },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn },
  );
}

/** Require a valid Bearer token; attaches req.user = { id, role, name }. */
function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(unauthorized('Missing bearer token'));
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = { id: payload.sub, role: payload.role, name: payload.name };
    next();
  } catch {
    next(unauthorized('Invalid or expired token'));
  }
}

/** Require req.user.role to be one of `roles`. */
const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(forbidden('Insufficient role'));
  }
  next();
};

module.exports = { signToken, authenticate, requireRole };

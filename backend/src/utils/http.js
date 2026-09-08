/** A thrown ApiError becomes a clean JSON response via the error middleware. */
class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const badRequest = (m, d) => new ApiError(400, m || 'Bad request', d);
const unauthorized = (m) => new ApiError(401, m || 'Unauthorized');
const forbidden = (m) => new ApiError(403, m || 'Forbidden');
const notFound = (m) => new ApiError(404, m || 'Not found');
const conflict = (m) => new ApiError(409, m || 'Conflict');

/** Wrap an async route handler so rejections reach next(). */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = {
  ApiError, asyncHandler,
  badRequest, unauthorized, forbidden, notFound, conflict,
};

const { badRequest } = require('./http');

/** Parse `data` with a zod schema; throw a 400 ApiError on failure. */
function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw badRequest('Validation failed', result.error.flatten());
  }
  return result.data;
}

/** Express middleware: validate req[part] and replace it with the parsed value. */
const body = (schema) => (req, _res, next) => {
  try {
    req.body = parse(schema, req.body);
    next();
  } catch (e) {
    next(e);
  }
};

module.exports = { parse, body };

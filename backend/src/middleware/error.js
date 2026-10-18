import { ApiError } from '../lib/errors.js';

/** Terminal 404 for unknown routes: keeps the `{ message }` error shape. */
export function notFoundHandler(_req, _res, next) {
  next(new ApiError(404, 'Not found'));
}

function normalize(err) {
  if (err instanceof ApiError) return { status: err.status, message: err.message };

  // Malformed JSON body (body-parser).
  if (err?.type === 'entity.parse.failed') {
    return { status: 400, message: 'Invalid JSON body' };
  }

  // Mongoose schema validation (seed/admin code paths).
  if (err?.name === 'ValidationError') {
    const messages = Object.values(err.errors ?? {}).map((e) => e.message);
    return { status: 400, message: messages[0] ?? 'Validation failed' };
  }

  // CastError: e.g. GET /api/bins/<not an ObjectId> — nothing can exist under it.
  if (err?.name === 'CastError') {
    if (err.path === '_id') return { status: 404, message: 'Bin not found' };
    return { status: 400, message: `Invalid value for ${err.path}` };
  }

  // Duplicate key (e.g. re-registering an existing deviceId).
  if (err?.code === 11000) {
    return { status: 409, message: 'Resource already exists' };
  }

  return { status: 500, message: 'Internal server error' };
}

/**
 * Central error handler. Every failure — thrown ApiError, async rejection
 * forwarded by Express 5, or an unexpected bug — leaves the API as
 * `{ message }` with the right status, which is all the frontend contract
 * needs. Unexpected errors are logged here, nowhere else.
 */
export function errorHandler(err, _req, res, _next) {
  const { status, message } = normalize(err);

  if (status >= 500) {
    console.error('[api] unhandled error:', err);
  }

  res.status(status).json({ message });
}

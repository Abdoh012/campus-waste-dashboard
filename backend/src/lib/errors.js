/**
 * Minimal HTTP error type. Thrown anywhere (routes, middleware) and rendered
 * by middleware/error.js as `{ message }` — the exact error shape the
 * frontend contract expects.
 */
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const badRequest = (message) => new ApiError(400, message);
export const unauthorized = (message) => new ApiError(401, message);
export const notFound = (message) => new ApiError(404, message);

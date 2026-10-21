/**
 * The one HTTP boundary for the dashboard API.
 *
 * The backend lives in `backend/` (Express + MongoDB) and exposes `/api`. The
 * dashboard routes are protected by a bearer JWT from `POST /api/auth/login`,
 * so this module owns the token and attaches it to every request. A 401 clears
 * the token: callers treat that as "session ended".
 *
 * `VITE_API_BASE_URL` points at a deployed API; locally it defaults to the
 * Express server on port 5001 (5000 is commonly reserved on Windows by
 * http.sys, e.g. IIS Express or Laravel Herd's `HerdHelper`, which answers
 * there with a bare 403).
 */

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5001/api'
).replace(/\/+$/, '');

/** localStorage key the JWT is kept under. */
const TOKEN_KEY = 'cw.token';

/**
 * A failed request. `status` is the HTTP status, or `0` when the request never
 * reached the server (offline, DNS, CORS) or the payload was malformed.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Narrow an unknown JSON value to an object before reading fields off it. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function getAuthToken(): string | null {
  try {
    const token = window.localStorage.getItem(TOKEN_KEY);
    // An older build could have written the literal string "undefined"/"null";
    // sending that as `Bearer undefined` makes every request 401.
    if (!token || token === 'undefined' || token === 'null') return null;
    return token;
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* Storage can be unavailable (private mode) — the session then lasts this tab only. */
  }
}

export function clearAuthToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* Nothing to clear. */
  }
}

async function errorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (isRecord(body) && typeof body.message === 'string') {
      return body.message;
    }
  } catch {
    /* Not a JSON error body. */
  }
  return fallback;
}

/**
 * Perform a JSON request and return the parsed body as `unknown`. Callers own
 * validation, because API responses are external data.
 */
export async function apiRequest(
  path: string,
  init: RequestInit = {},
): Promise<unknown> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body !== undefined) headers.set('Content-Type', 'application/json');

  const token = getAuthToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch (cause) {
    // Let an abort keep its own identity so effects can ignore it.
    if (init.signal?.aborted) throw cause;
    throw new ApiError(0, 'Network request failed');
  }

  if (response.status === 401) {
    clearAuthToken();
    throw new ApiError(
      401,
      await errorMessage(response, 'Authentication required'),
    );
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      await errorMessage(response, `Request failed (${response.status})`),
    );
  }

  const body: unknown = await response.json();
  return body;
}

import jwt from 'jsonwebtoken';
import { env } from '../env.js';
import { unauthorized } from '../lib/errors.js';

/**
 * JWT bearer guard for the dashboard-facing routes.
 *
 * The frontend attaches `Authorization: Bearer <token>` to every call; any
 * failure here is a 401, which the frontend interprets uniformly as
 * "session expired → back to /login".
 */
export function requireAuth(req, _res, next) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(unauthorized('Authentication required'));
  }

  try {
    req.auth = jwt.verify(token, env.JWT_SECRET);
    return next();
  } catch {
    return next(unauthorized('Invalid or expired token'));
  }
}

/**
 * Optional gate for the ESP32 ingest route: active only when
 * DEVICE_INGEST_KEY is configured (the device contract itself has no auth
 * header, so this is off by default — see README "Security notes").
 */
export function requireDeviceKey(req, _res, next) {
  if (!env.DEVICE_INGEST_KEY) return next();
  if (req.headers['x-device-key'] === env.DEVICE_INGEST_KEY) return next();
  return next(unauthorized('Invalid device key'));
}

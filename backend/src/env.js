/* ============================================================================
   ENV.JS — single place where configuration is read and validated.

   Everything is env-driven (see .env.example). The only hard requirement is
   JWT_SECRET outside development: signing tokens with a default secret in
   production would be a real vulnerability, so the process refuses to start.
============================================================================ */

import 'dotenv/config';

const DEV_FALLBACK_SECRET = 'dev-only-insecure-jwt-secret-do-not-use-in-production';

function parseIntEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer (got "${raw}")`);
  }
  return value;
}

/** CORS origin: '*' (default) or a comma-separated list like "http://localhost:5173". */
function parseOrigins() {
  const raw = (process.env.CORS_ORIGIN ?? '*').trim();
  if (raw === '*') return '*';
  return raw.split(',').map((origin) => origin.trim()).filter(Boolean);
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseIntEnv('PORT', 5000),
  MONGODB_URI: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/campus_waste',

  JWT_SECRET: process.env.JWT_SECRET || DEV_FALLBACK_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',

  CORS_ORIGINS: parseOrigins(),

  /**
   * A bin whose lastSyncAt is older than this reads back as `offline`
   * regardless of the status stored at ingest time (see lib/status.js).
   */
  OFFLINE_THRESHOLD_MINUTES: parseIntEnv('OFFLINE_THRESHOLD_MINUTES', 5),

  /**
   * Optional shared secret for the ESP32 ingest route. Empty = ingest is open
   * (the device contract has no auth header). Set a value to require
   * `X-Device-Key: <value>` on PUT /api/bins/:deviceId/status.
   */
  DEVICE_INGEST_KEY: process.env.DEVICE_INGEST_KEY ?? '',

  /** Seed-script defaults (scripts/seed.js). */
  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL ?? 'admin@batu.edu.eg',
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD ?? '',
};

if (env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set when NODE_ENV=production');
}
if (env.NODE_ENV !== 'production' && !process.env.JWT_SECRET) {
  console.warn('! JWT_SECRET not set — using an insecure development fallback. Set it before deploying.');
}

export const OFFLINE_THRESHOLD_MS = env.OFFLINE_THRESHOLD_MINUTES * 60_000;

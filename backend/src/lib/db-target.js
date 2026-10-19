/* ============================================================================
   DB-TARGET.JS — "is this MongoDB safe to write destructive operations to?"

   `scripts/seed.js`, `scripts/assign-demo-stations.js` and the integration
   tests all write or delete data. None of them should ever be able to point at
   a shared, staging or production database by accident, so all three funnel
   their `MONGODB_URI` / `TEST_MONGODB_URI` through the guards below.

   The guard is deliberately NOT just an NODE_ENV check: a missing or misnamed
   NODE_ENV must not be treated as proof that the target is safe. The URI host
   and database name are validated as well.
============================================================================ */

const LOCAL_HOSTNAME = /^(127\.0\.0\.1|localhost|::1)$/i;
const PRODUCTION_LIKE_ENV = /^(prod|production|live|staging|stage|uat|qa|preprod|pre-prod)([._-].*)?$/i;
const TEST_DATABASE_NAME = /(^|[_-])tests?$/i;

function normaliseHost(hostname) {
  if (typeof hostname !== 'string') return '';
  return hostname.toLowerCase().replace(/^\[/, '').replace(/\]$/, '');
}

/**
 * Parse a MongoDB connection string into its host and database.
 *
 * Returns `null` for anything malformed or ambiguous (multiple hosts, no
 * database, a non-mongodb scheme) so callers can fail closed instead of
 * guessing. Environment-specific multi-host replica-set URIs are rejected on
 * purpose: they are never a local development target.
 */
export function parseMongoTarget(uri) {
  if (typeof uri !== 'string') return null;

  const trimmed = uri.trim();
  if (trimmed === '') return null;

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'mongodb:' && parsed.protocol !== 'mongodb+srv:') return null;

  const host = normaliseHost(parsed.hostname);
  if (host === '') return null;

  const path = decodeURIComponent(parsed.pathname || '');
  const database = path.replace(/^\/+/, '').split('/')[0] ?? '';

  return {
    protocol: parsed.protocol,
    host,
    database,
    isLocal: LOCAL_HOSTNAME.test(host),
  };
}

/** True when NODE_ENV names (or plausibly names) a non-development environment. */
export function isProductionLikeEnv(nodeEnv) {
  return typeof nodeEnv === 'string' && PRODUCTION_LIKE_ENV.test(nodeEnv.trim());
}

/** True when the database name is explicitly test-only, e.g. `campus_waste_test`. */
export function isTestDatabaseName(database) {
  return typeof database === 'string' && TEST_DATABASE_NAME.test(database);
}

/** True when the database name mentions production (never a safe write target). */
export function looksProductionLikeDatabase(database) {
  return typeof database === 'string' && /prod/i.test(database);
}

function refuse(scriptName, reasons) {
  const error = new Error(
    `Refusing to run ${scriptName}: the target is not a safe development database.\n` +
      reasons.map((reason) => `  - ${reason}`).join('\n'),
  );
  error.reasons = reasons;
  return error;
}

/**
 * Guard for data-writing development scripts (seed, station association).
 *
 * Requires a single, local MongoDB host and a non-production database name,
 * and rejects production-like NODE_ENV values. Throws with an explanatory
 * `reasons` array when the target is unsafe; returns the parsed target when it
 * is safe.
 */
export function assertSafeLocalDevelopmentTarget({ uri, nodeEnv, scriptName = 'script' }) {
  const reasons = [];
  const target = parseMongoTarget(uri);

  if (!target) {
    reasons.push(
      'MONGODB_URI is missing, malformed or ambiguous (expected one local mongodb:// host and a database name).',
    );
  } else {
    if (!target.isLocal) {
      reasons.push(`host "${target.host}" is not local (allowed: 127.0.0.1, localhost, ::1).`);
    }
    if (target.database === '') {
      reasons.push('MONGODB_URI does not name a database.');
    } else if (looksProductionLikeDatabase(target.database)) {
      reasons.push(`database "${target.database}" looks production-like.`);
    }
  }

  if (isProductionLikeEnv(nodeEnv)) {
    reasons.push(`NODE_ENV="${nodeEnv}" is production-like; local development is required.`);
  }

  if (reasons.length > 0) throw refuse(scriptName, reasons);
  return target;
}

/**
 * Guard for the integration tests, which call `dropDatabase()`.
 *
 * Requires a single local host AND a database whose name ends in `_test`
 * (or `_tests`), and rejects production-like NODE_ENV values. The default
 * `campus_waste_test` passes; the application's `campus_waste` database does
 * not, so a mistyped TEST_MONGODB_URI fails closed instead of being dropped.
 */
export function assertSafeTestTarget({ uri, nodeEnv, scriptName = 'integration tests' }) {
  const reasons = [];
  const target = parseMongoTarget(uri);

  if (!target) {
    reasons.push('TEST_MONGODB_URI is missing, malformed or ambiguous.');
  } else {
    if (!target.isLocal) {
      reasons.push(`host "${target.host}" is not local (allowed: 127.0.0.1, localhost, ::1).`);
    }
    if (!isTestDatabaseName(target.database)) {
      reasons.push(
        `database "${target.database || '(none)'}" is not test-only (it must end in "_test" or "_tests").`,
      );
    }
    if (looksProductionLikeDatabase(target.database)) {
      reasons.push(`database "${target.database}" looks production-like.`);
    }
  }

  if (isProductionLikeEnv(nodeEnv)) {
    reasons.push(`NODE_ENV="${nodeEnv}" is production-like; tests refuse to run.`);
  }

  if (reasons.length > 0) throw refuse(scriptName, reasons);
  return target;
}

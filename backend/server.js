import mongoose from 'mongoose';
import { createApp } from './src/app.js';
import { env } from './src/env.js';
import { parseMongoTarget } from './src/lib/db-target.js';

/**
 * Process entry point: connect MongoDB, start listening, shut down cleanly.
 * All configuration comes from the environment (src/env.js / .env.example).
 *
 * Logs only the database name, never the connection string: the URI contains
 * the password and driver errors can echo it back.
 */
const MONGO_URI_PATTERN = /mongodb(?:\+srv)?:\/\/[^\s"'`]+/gi;

function redact(value) {
  return String(value).replace(MONGO_URI_PATTERN, '[redacted MongoDB URI]');
}

async function main() {
  const database = parseMongoTarget(env.MONGODB_URI)?.database || '(unknown database)';

  try {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  } catch (err) {
    console.error(`✗ MongoDB connection failed (database: ${database}): ${redact(err.message)}`);
    console.error('  Is mongod running? See README.md → Installation.');
    process.exit(1);
  }

  console.log(`✓ MongoDB connected — database: ${database}`);

  mongoose.connection.on('error', (err) => {
    console.error('[mongo] connection error:', redact(err.message));
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('[mongo] disconnected — waiting for driver to reconnect…');
  });

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`✓ Think Outside The Box API listening on http://localhost:${env.PORT}/api`);
    console.log(`  environment: ${env.NODE_ENV} · offline threshold: ${env.OFFLINE_THRESHOLD_MINUTES}m`);
  });

  const shutdown = (signal) => {
    console.log(`\n${signal} received — shutting down…`);
    server.close(async () => {
      await mongoose.disconnect().catch(() => {});
      process.exit(0);
    });
    // Hard stop if a keep-alive connection refuses to end.
    setTimeout(() => process.exit(1), 5000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main();

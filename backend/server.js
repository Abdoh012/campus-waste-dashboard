import mongoose from 'mongoose';
import { createApp } from './src/app.js';
import { env } from './src/env.js';

/**
 * Process entry point: connect MongoDB, start listening, shut down cleanly.
 * All configuration comes from the environment (src/env.js / .env.example).
 */
async function main() {
  try {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  } catch (err) {
    console.error(`✗ MongoDB connection failed (${env.MONGODB_URI}): ${err.message}`);
    console.error('  Is mongod running? See README.md → Installation.');
    process.exit(1);
  }

  console.log(`✓ MongoDB connected — ${env.MONGODB_URI}`);

  mongoose.connection.on('error', (err) => {
    console.error('[mongo] connection error:', err.message);
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

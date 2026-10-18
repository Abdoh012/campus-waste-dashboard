/**
 * Development seed — idempotent.
 *
 *   npm run seed             upsert the admin + six sample bins
 *   npm run seed -- --reset   additionally wipe every bin first
 *
 * The sample bins are dev fixtures so the dashboard has something real to
 * render before the physical ESP32s are registered: they cover all four
 * read-time statuses (fill levels → healthy / attention / critical, plus one
 * deliberately stale device that reads `offline`).
 *
 * The admin password comes from SEED_ADMIN_PASSWORD, or is generated here
 * and printed once — set SEED_ADMIN_PASSWORD in .env for a stable credential.
 */

import crypto from 'node:crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../src/env.js';
import { User } from '../src/models/User.js';
import { Bin } from '../src/models/Bin.js';
import { statusForFillLevel } from '../src/lib/status.js';

const MINUTE = 60_000;

/** deviceId, position and a fill level per demo bin; `minutesAgo` ages lastSyncAt. */
const SAMPLE_BINS = [
  { deviceId: 'ESP32-BIN-01', name: 'North Gate Bin', building: 'North Gate', lat: 31.2185, lng: 29.952, fillLevel: 18, minutesAgo: 2 },
  { deviceId: 'ESP32-BIN-02', name: 'Science Hall Bin', building: 'Science Hall', lat: 31.217, lng: 29.9565, fillLevel: 54, minutesAgo: 1 },
  { deviceId: 'ESP32-BIN-03', name: 'Student Union Bin', building: 'Student Union', lat: 31.2156, lng: 29.9553, fillLevel: 87, minutesAgo: 1 },
  // Stale on purpose: older than OFFLINE_THRESHOLD_MINUTES → GET reports offline.
  { deviceId: 'ESP32-BIN-04', name: 'Arts Center Bin', building: 'Arts Center', lat: 31.214, lng: 29.953, fillLevel: 21, minutesAgo: 45 },
  { deviceId: 'ESP32-BIN-05', name: 'Rec Center Bin', building: 'Rec Center', lat: 31.2132, lng: 29.9575, fillLevel: 12, minutesAgo: 3 },
  { deviceId: 'ESP32-BIN-06', name: 'Library Bin', building: 'Library', lat: 31.2163, lng: 29.959, fillLevel: 63, minutesAgo: 2 },
];

async function seedAdmin() {
  const email = env.SEED_ADMIN_EMAIL.trim().toLowerCase();
  const existing = await User.findOne({ email }).select('+passwordHash');

  if (existing) {
    if (env.SEED_ADMIN_PASSWORD) {
      existing.passwordHash = await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 10);
      await existing.save();
      console.log(`✓ Admin ${email} — password updated from SEED_ADMIN_PASSWORD`);
    } else {
      console.log(`✓ Admin ${email} already exists — password unchanged`);
    }
    return;
  }

  const password = env.SEED_ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
  await User.create({ email, passwordHash: await bcrypt.hash(password, 10) });

  console.log(`✓ Admin created: ${email}`); // OGW-_0PEtMBl
  console.log(`  password: ${password}`);
  if (!env.SEED_ADMIN_PASSWORD) {
    console.log('  (generated — set SEED_ADMIN_PASSWORD in .env to pick your own)');
  }
}

async function seedBins(reset) {
  if (reset) {
    const { deletedCount } = await Bin.deleteMany({});
    console.log(`✓ --reset: dropped ${deletedCount} bin(s)`);
  }

  for (const sample of SAMPLE_BINS) {
    const status = statusForFillLevel(sample.fillLevel);
    const syncedAt = new Date(Date.now() - sample.minutesAgo * MINUTE);
    await Bin.findOneAndUpdate(
      { deviceId: sample.deviceId },
      {
        $set: {
          name: sample.name,
          location: { building: sample.building, lat: sample.lat, lng: sample.lng },
          fillLevel: sample.fillLevel,
          status,
          lastSyncAt: syncedAt,
        },
      },
      { upsert: true },
    );
    const readsOffline = Date.now() - syncedAt.getTime() > env.OFFLINE_THRESHOLD_MINUTES * MINUTE;
    console.log(
      `✓ ${sample.deviceId.padEnd(14)} ${sample.building.padEnd(15)} fill=${String(sample.fillLevel).padStart(3)}% status=${status} synced=${sample.minutesAgo}m ago${readsOffline ? ' → reads offline' : ''}`,
    );
  }
}

async function main() {
  try {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  } catch (err) {
    console.error(`✗ MongoDB connection failed (${env.MONGODB_URI}): ${err.message}`);
    process.exit(1);
  }

  try {
    const reset = process.argv.includes('--reset');
    console.log(`Seeding ${env.MONGODB_URI}\n`);
    await seedAdmin();
    console.log('');
    await seedBins(reset);
    console.log('\n✓ Seed complete.');
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('✗ Seed failed:', err);
  process.exit(1);
});

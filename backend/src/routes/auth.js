import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../env.js';
import { badRequest, unauthorized } from '../lib/errors.js';
import { User } from '../models/User.js';

const router = Router();

/**
 * A real bcrypt hash to compare against when the email doesn't exist, so a
 * 401 for an unknown address costs the same time as one for a wrong
 * password (no user enumeration via response timing). Computed once, lazily.
 */
let dummyHashPromise = null;
function getDummyHash() {
  if (!dummyHashPromise) {
    dummyHashPromise = bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
  }
  return dummyHashPromise;
}

/**
 * POST /api/auth/login
 *   body: { email, password }
 *   200:  { token, user: { _id, email } }
 *   400:  { message: 'Email and password are required' }
 *   401:  { message: 'Invalid email or password' }
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};

  if (
    typeof email !== 'string' || !email.trim() ||
    typeof password !== 'string' || !password
  ) {
    throw badRequest('Email and password are required');
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');

  // Always run a bcrypt compare — with the real hash or the dummy one.
  const storedHash = user ? user.passwordHash : await getDummyHash();
  const matches = await bcrypt.compare(password, storedHash);

  if (!user || !matches) {
    throw unauthorized('Invalid email or password');
  }

  const token = jwt.sign({ sub: String(user._id), email: user.email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  res.status(200).json({ token, user: user.toAuthDto() });
});

export default router;

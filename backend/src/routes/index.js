import { Router } from 'express';
import authRouter from './auth.js';
import binsRouter from './bins.js';
import statsRouter from './stats.js';

const router = Router();

/** Liveness probe — no auth, no data. */
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: Math.round(process.uptime()) });
});

router.use('/auth', authRouter);
router.use('/bins', binsRouter);
router.use('/stats', statsRouter);

export default router;

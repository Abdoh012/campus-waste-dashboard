// src/routes/stats.js
import { Router } from 'express';
import {
  getDailyPoints,
  getFillHistory,
  getStats,
} from '../controllers/statsController.js';
import { requireAuth } from '../middleware/auth.js';

const statsRouter = Router();
statsRouter.get('/', requireAuth, getStats);
statsRouter.get('/fill-history', requireAuth, getFillHistory);
statsRouter.get('/points-daily', requireAuth, getDailyPoints);

export default statsRouter;
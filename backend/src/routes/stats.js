// src/routes/stats.js
import { Router } from 'express';
import { getStats } from '../controllers/statsController.js';
import { requireAuth } from '../middleware/auth.js';

const statsRouter = Router();
statsRouter.get('/', requireAuth, getStats);

export default statsRouter;
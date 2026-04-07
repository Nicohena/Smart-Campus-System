import { Router } from 'express';
import { getMaintenancePredictions } from '../controllers/predictiveController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Admin-only predictive maintenance endpoint
router.get(
  '/maintenance',
  authMiddleware,
  requireRole(['admin']),
  getMaintenancePredictions
);

export default router;

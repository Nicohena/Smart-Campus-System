import { Router } from 'express';
import { getMaintenancePredictions } from '../controllers/predictiveController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Staff/admin-only predictive maintenance endpoint
router.get(
  '/maintenance',
  authMiddleware,
  requireRole(['staff', 'admin']),
  getMaintenancePredictions
);

export default router;

import { Router } from 'express';
import {
  getDashboardAnalytics,
  getIssuesAnalytics,
  getComplaintsAnalytics,
  getAiInsights
} from '../controllers/analyticsController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// All analytics endpoints require staff/admin
router.get('/dashboard', authMiddleware, requireRole(['staff', 'admin']), getDashboardAnalytics);
router.get('/issues', authMiddleware, requireRole(['staff', 'admin']), getIssuesAnalytics);
router.get('/complaints', authMiddleware, requireRole(['staff', 'admin']), getComplaintsAnalytics);
router.get('/ai-insights', authMiddleware, requireRole(['staff', 'admin']), getAiInsights);

export default router;

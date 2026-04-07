import { Router } from 'express';
import {
  getDashboardAnalytics,
  getIssuesAnalytics,
  getComplaintsAnalytics,
  getAiInsights
} from '../controllers/analyticsController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Analytics is admin-only
router.get('/dashboard', authMiddleware, requireRole(['admin']), getDashboardAnalytics);
router.get('/issues', authMiddleware, requireRole(['admin']), getIssuesAnalytics);
router.get('/complaints', authMiddleware, requireRole(['admin']), getComplaintsAnalytics);
router.get('/ai-insights', authMiddleware, requireRole(['admin']), getAiInsights);

export default router;

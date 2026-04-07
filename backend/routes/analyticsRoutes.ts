import { Router } from 'express';
import {
  getDashboardAnalytics,
  getIssuesAnalytics,
  getComplaintsAnalytics,
  getAiInsights,
  getDepartmentAnalytics
} from '../controllers/analyticsController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Analytics is restricted by role type
router.get('/dashboard', authMiddleware, requireRole(['admin', 'proctor', 'student_union', 'security', 'department']), getDashboardAnalytics);
router.get('/issues', authMiddleware, requireRole(['admin', 'proctor']), getIssuesAnalytics);
router.get('/complaints', authMiddleware, requireRole(['admin', 'student_union']), getComplaintsAnalytics);
router.get('/department', authMiddleware, requireRole(['department']), getDepartmentAnalytics);
router.get('/ai-insights', authMiddleware, requireRole(['admin']), getAiInsights);

export default router;

import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  reportIssue,
  getMyIssues,
  getAllIssues,
  assignTechnician,
  updateIssueStatus,
  getDormIssues
} from '../controllers/issueController';
import { authMiddleware, requireRole } from '../middleware/auth';
import { validationResultHandler } from './validationHelpers';

const router = Router();

// Student routes
router.post(
  '/report',
  authMiddleware,
  requireRole(['student']),
  [body('issueType').isString().trim(), body('description').isString().trim()],
  validationResultHandler,
  reportIssue
);

router.get('/my-issues', authMiddleware, requireRole(['student']), getMyIssues);

// Staff/Admin routes
router.get('/', authMiddleware, requireRole(['staff', 'admin']), getAllIssues);

router.patch(
  '/:id/assign',
  authMiddleware,
  requireRole(['staff', 'admin']),
  [param('id').isMongoId(), body('assignedTechnician').isMongoId()],
  validationResultHandler,
  assignTechnician
);

router.patch(
  '/:id/status',
  authMiddleware,
  requireRole(['staff', 'admin']),
  [param('id').isMongoId(), body('status').isString().trim()],
  validationResultHandler,
  updateIssueStatus
);

router.get(
  '/dorm/:dormId',
  authMiddleware,
  requireRole(['staff', 'admin']),
  [param('dormId').isMongoId()],
  validationResultHandler,
  getDormIssues
);

export default router;

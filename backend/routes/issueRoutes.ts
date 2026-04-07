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

// Proctor routes
router.get('/', authMiddleware, requireRole(['proctor']), getAllIssues);

router.patch(
  '/:id/assign',
  authMiddleware,
  requireRole(['proctor']),
  [param('id').isMongoId(), body('assignedTechnician').isMongoId()],
  validationResultHandler,
  assignTechnician
);

router.patch(
  '/:id/status',
  authMiddleware,
  requireRole(['proctor']),
  [param('id').isMongoId(), body('status').isString().trim()],
  validationResultHandler,
  updateIssueStatus
);

router.get(
  '/dorm/:dormId',
  authMiddleware,
  requireRole(['proctor']),
  [param('dormId').isMongoId()],
  validationResultHandler,
  getDormIssues
);

export default router;

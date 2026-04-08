import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  submitComplaint,
  getMyComplaints,
  getAllComplaints,
  updateComplaintStatus,
  assignComplaintHandler,
  setComplaintPriority
} from '../controllers/complaintController';
import { authMiddleware, requireRole } from '../middleware/auth';
import { validationResultHandler } from './validationHelpers';

const router = Router();

// Student routes
router.post(
  '/',
  authMiddleware,
  requireRole(['student']),
  [
    body('category').isString().trim(),
    body('title').isString().trim(),
    body('description').isString().trim()
  ],
  validationResultHandler,
  submitComplaint
);

router.get('/my', authMiddleware, requireRole(['student']), getMyComplaints);

// Student union routes
router.get('/', authMiddleware, requireRole(['student_union']), getAllComplaints);

router.patch(
  '/:id/status',
  authMiddleware,
  requireRole(['student_union']),
  [param('id').isMongoId(), body('status').isString().trim()],
  validationResultHandler,
  updateComplaintStatus
);

router.patch(
  '/:id/assign',
  authMiddleware,
  requireRole(['student_union']),
  [param('id').isMongoId(), body('handledBy').isString().trim().isLength({ min: 1 })],
  validationResultHandler,
  assignComplaintHandler
);

router.patch(
  '/:id/priority',
  authMiddleware,
  requireRole(['student_union']),
  [param('id').isMongoId(), body('priority').isString().trim()],
  validationResultHandler,
  setComplaintPriority
);

export default router;

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

// Staff/Admin routes
router.get('/', authMiddleware, requireRole(['staff', 'admin']), getAllComplaints);

router.patch(
  '/:id/status',
  authMiddleware,
  requireRole(['staff', 'admin']),
  [param('id').isMongoId(), body('status').isString().trim()],
  validationResultHandler,
  updateComplaintStatus
);

router.patch(
  '/:id/assign',
  authMiddleware,
  requireRole(['staff', 'admin']),
  [param('id').isMongoId(), body('handledBy').isMongoId()],
  validationResultHandler,
  assignComplaintHandler
);

router.patch(
  '/:id/priority',
  authMiddleware,
  requireRole(['staff', 'admin']),
  [param('id').isMongoId(), body('priority').isString().trim()],
  validationResultHandler,
  setComplaintPriority
);

export default router;

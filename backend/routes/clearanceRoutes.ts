import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  requestClearance,
  getMyClearance,
  getAllClearanceRequests,
  approveLibrary,
  approveCafeteria,
  approveProctor,
  approveSecurity
} from '../controllers/clearanceController';
import { authMiddleware, requireRole } from '../middleware/auth';
import { validationResultHandler } from './validationHelpers';

const router = Router();

// Student routes
router.post(
  '/request',
  authMiddleware,
  requireRole(['student']),
  [body('academicYear').isString().trim()],
  validationResultHandler,
  requestClearance
);
router.get('/my-clearance', authMiddleware, requireRole(['student']), getMyClearance);

// Proctor routes
router.get('/', authMiddleware, requireRole(['proctor']), getAllClearanceRequests);

router.patch(
  '/:id/library',
  authMiddleware,
  requireRole(['proctor']),
  [param('id').isMongoId()],
  validationResultHandler,
  approveLibrary
);

router.patch(
  '/:id/cafeteria',
  authMiddleware,
  requireRole(['proctor']),
  [param('id').isMongoId()],
  validationResultHandler,
  approveCafeteria
);

router.patch(
  '/:id/proctor',
  authMiddleware,
  requireRole(['proctor']),
  [param('id').isMongoId()],
  validationResultHandler,
  approveProctor
);

router.patch(
  '/:id/security',
  authMiddleware,
  requireRole(['proctor']),
  [param('id').isMongoId()],
  validationResultHandler,
  approveSecurity
);

export default router;

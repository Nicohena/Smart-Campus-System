import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  submitLostIdRequest,
  getMyLostIdRequests,
  getAllLostIdRequests,
  updateStampStatus,
  approveLostIdRequest,
  rejectLostIdRequest,
  issueTemporaryId
} from '../controllers/lostIdController';
import { authMiddleware, requireRole } from '../middleware/auth';
import { validationResultHandler } from './validationHelpers';

const router = Router();

// Student routes
router.post('/request', authMiddleware, requireRole(['student']), submitLostIdRequest);
router.get('/my-requests', authMiddleware, requireRole(['student']), getMyLostIdRequests);

// Operational staff routes
router.get('/', authMiddleware, requireRole(['department', 'proctor', 'security']), getAllLostIdRequests);

router.patch(
  '/:id/stamp',
  authMiddleware,
  requireRole(['department', 'proctor', 'security']),
  [
    param('id').isMongoId(),
    body('stamp').optional().isString().trim(),
    body('value').optional().isBoolean(),
    body('stamps').optional().isObject()
  ],
  validationResultHandler,
  updateStampStatus
);

router.patch(
  '/:id/approve',
  authMiddleware,
  requireRole(['department', 'proctor', 'security']),
  [param('id').isMongoId()],
  validationResultHandler,
  approveLostIdRequest
);

router.patch(
  '/:id/reject',
  authMiddleware,
  requireRole(['department', 'proctor', 'security']),
  [param('id').isMongoId(), body('remarks').isString().trim()],
  validationResultHandler,
  rejectLostIdRequest
);

router.patch(
  '/:id/temporary-id',
  authMiddleware,
  requireRole(['department', 'proctor', 'security']),
  [param('id').isMongoId()],
  validationResultHandler,
  issueTemporaryId
);

export default router;

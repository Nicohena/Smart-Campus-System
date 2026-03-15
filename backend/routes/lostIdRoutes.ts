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

// Staff/Admin routes
router.get('/', authMiddleware, requireRole(['staff', 'admin']), getAllLostIdRequests);

router.patch(
  '/:id/stamp',
  authMiddleware,
  requireRole(['staff', 'admin']),
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
  requireRole(['staff', 'admin']),
  [param('id').isMongoId()],
  validationResultHandler,
  approveLostIdRequest
);

router.patch(
  '/:id/reject',
  authMiddleware,
  requireRole(['staff', 'admin']),
  [param('id').isMongoId(), body('remarks').isString().trim()],
  validationResultHandler,
  rejectLostIdRequest
);

router.patch(
  '/:id/temporary-id',
  authMiddleware,
  requireRole(['staff', 'admin']),
  [param('id').isMongoId()],
  validationResultHandler,
  issueTemporaryId
);

export default router;

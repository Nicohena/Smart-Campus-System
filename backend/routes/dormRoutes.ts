import { Router } from 'express';
import { body, query } from 'express-validator';
import {
  allocateDormToStudent,
  getStudentDorm,
  issueDormKey,
  returnDormKey,
  inspectDorm,
  getDormInspectionHistory
} from '../controllers/dormController';
import { authMiddleware, requireRole } from '../middleware/auth';
import { validationResultHandler } from './validationHelpers';

const router = Router();

// Proctor routes
router.post(
  '/allocate',
  authMiddleware,
  requireRole(['proctor']),
  [
    body('studentId').isString().trim(),
    body('yearLevel').isString().trim(),
    body('isSpecialNeeds').optional().isBoolean(),
    body('department').optional().isString().trim()
  ],
  validationResultHandler,
  allocateDormToStudent
);

router.post(
  '/issue-key',
  authMiddleware,
  requireRole(['proctor']),
  [body('dormId').isMongoId(), body('issuedTo').isMongoId(), body('keyNumber').isString().trim()],
  validationResultHandler,
  issueDormKey
);

router.patch(
  '/return-key',
  authMiddleware,
  requireRole(['proctor']),
  [body('keyId').isMongoId()],
  validationResultHandler,
  returnDormKey
);

router.post(
  '/inspect',
  authMiddleware,
  requireRole(['proctor']),
  [
    body('dormId').isMongoId(),
    body('conditions').isObject(),
    body('cleanliness').isBoolean(),
    body('approved').isBoolean(),
    body('damages').optional().isString().trim()
  ],
  validationResultHandler,
  inspectDorm
);

router.get(
  '/inspections',
  authMiddleware,
  requireRole(['proctor']),
  [query('dormId').optional().isMongoId(), query('studentId').optional().isString().trim()],
  validationResultHandler,
  getDormInspectionHistory
);

export default router;

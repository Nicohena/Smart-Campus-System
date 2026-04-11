import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  reportLostId,
  getMyLostIdRequests,
  getAllLostIdRequests,
  requestReplacement,
  requestPayment,
  submitPayment,
  verifyPayment,
  issueTemporaryId,
  issuePermanentId,
  rejectLostIdRequest,
  resubmitRequest,
  bulkVerifyPayments,
  getLostIdAnalytics,
} from '../controllers/lostIdController';
import { authMiddleware, requireRole } from '../middleware/auth';
import { validationResultHandler } from './validationHelpers';

const router = Router();

const ALL_STAFF = ['admin', 'department', 'proctor', 'security', 'library', 'cafeteria', 'registrar'] as const;

// ── Student routes ────────────────────────────────────────────────────────────

// Step 1: Report (auto-blocked)
router.post(
  '/report',
  authMiddleware,
  requireRole(['student']),
  [body('reason').isIn(['lost','damaged','stolen','other'])],
  validationResultHandler,
  reportLostId
);

// Step 2: Request replacement
router.patch(
  '/:id/request-replacement',
  authMiddleware,
  requireRole(['student']),
  [param('id').isMongoId()],
  validationResultHandler,
  requestReplacement
);

// Step 4: Submit payment receipt
router.patch(
  '/:id/submit-payment',
  authMiddleware,
  requireRole(['student']),
  [param('id').isMongoId(), body('paymentReference').isString().trim().notEmpty()],
  validationResultHandler,
  submitPayment
);

// Resubmit from rejected
router.patch(
  '/:id/resubmit',
  authMiddleware,
  requireRole(['student']),
  [param('id').isMongoId()],
  validationResultHandler,
  resubmitRequest
);

// Student read
router.get('/my-requests', authMiddleware, requireRole(['student']), getMyLostIdRequests);

// ── Staff read ────────────────────────────────────────────────────────────────
router.get(
  '/',
  authMiddleware,
  requireRole([...ALL_STAFF]),
  [query('status').optional().isString(), query('page').optional().isInt(), query('limit').optional().isInt()],
  validationResultHandler,
  getAllLostIdRequests
);

// ── Registrar: Step 3 — set up payment ───────────────────────────────────────
router.patch(
  '/:id/request-payment',
  authMiddleware,
  requireRole(['registrar']),
  [param('id').isMongoId(), body('overrideAmount').optional().isNumeric()],
  validationResultHandler,
  requestPayment
);

// ── Registrar: Step 5 — verify payment ───────────────────────────────────────
router.patch(
  '/:id/verify-payment',
  authMiddleware,
  requireRole(['registrar']),
  [param('id').isMongoId()],
  validationResultHandler,
  verifyPayment
);

// ── Registrar: Bulk verify ────────────────────────────────────────────────────
router.patch(
  '/bulk-verify',
  authMiddleware,
  requireRole(['registrar']),
  [body('ids').isArray({ min: 1 })],
  validationResultHandler,
  bulkVerifyPayments
);

// ── Registrar: Step 6 — issue temporary ID ───────────────────────────────────
router.patch(
  '/:id/issue-temporary',
  authMiddleware,
  requireRole(['registrar']),
  [param('id').isMongoId(), body('temporaryIdNumber').optional().isString().trim()],
  validationResultHandler,
  issueTemporaryId
);

// ── Registrar: Step 7 — issue permanent ID ───────────────────────────────────
router.patch(
  '/:id/issue-permanent',
  authMiddleware,
  requireRole(['registrar']),
  [param('id').isMongoId(), body('permanentIdNumber').optional().isString().trim()],
  validationResultHandler,
  issuePermanentId
);

// ── Controlled rejection (role-validated in controller) ───────────────────────
router.patch(
  '/:id/reject',
  authMiddleware,
  requireRole([...ALL_STAFF]),
  [param('id').isMongoId(), body('remarks').isString().trim().notEmpty()],
  validationResultHandler,
  rejectLostIdRequest
);

// ── Analytics (admin / registrar) ────────────────────────────────────────────
router.get(
  '/analytics',
  authMiddleware,
  requireRole(['admin', 'registrar']),
  getLostIdAnalytics
);

export default router;

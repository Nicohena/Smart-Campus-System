import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createNotice,
  updateNotice,
  deleteNotice,
  setNoticeStatus,
  getAllNotices,
  getDepartmentNotices,
  getDormNotices,
  getNoticeById
} from '../controllers/noticeController';
import { authMiddleware, requireRole } from '../middleware/auth';
import { validationResultHandler } from './validationHelpers';

const router = Router();

// Public (authenticated students)
router.get('/', authMiddleware, getAllNotices);
router.get('/department/:department', authMiddleware, getDepartmentNotices);
router.get('/dorm/:block', authMiddleware, getDormNotices);
router.get('/:id', authMiddleware, [param('id').isMongoId()], validationResultHandler, getNoticeById);

// Staff/Admin routes
router.post(
  '/',
  authMiddleware,
  requireRole(['staff', 'admin']),
  [
    body('title').isString().trim(),
    body('description').isString().trim(),
    body('category').isString().trim(),
    body('targetAudience').isString().trim(),
    body('priority').optional().isString().trim(),
    body('attachments').optional().isArray(),
    body('expiryDate').optional().isISO8601()
  ],
  validationResultHandler,
  createNotice
);

router.patch(
  '/:id',
  authMiddleware,
  requireRole(['staff', 'admin']),
  [param('id').isMongoId()],
  validationResultHandler,
  updateNotice
);

router.delete(
  '/:id',
  authMiddleware,
  requireRole(['staff', 'admin']),
  [param('id').isMongoId()],
  validationResultHandler,
  deleteNotice
);

router.patch(
  '/:id/status',
  authMiddleware,
  requireRole(['staff', 'admin']),
  [param('id').isMongoId(), body('status').isString().trim()],
  validationResultHandler,
  setNoticeStatus
);

export default router;

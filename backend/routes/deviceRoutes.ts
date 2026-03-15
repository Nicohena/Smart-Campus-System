import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  registerDevice,
  getAllDevices,
  blockDevice,
  getMyDevices,
  getDeviceById,
  deleteDeviceById
} from '../controllers/deviceController';
import { authMiddleware, requireRole } from '../middleware/auth';
import { validationResultHandler } from './validationHelpers';

const router = Router();

// Student routes
router.get('/my', authMiddleware, requireRole(['student']), getMyDevices);
router.get('/:id', authMiddleware, requireRole(['student']), [param('id').isMongoId()], validationResultHandler, getDeviceById);

// Security/Admin routes
router.post(
  '/register',
  authMiddleware,
  requireRole(['staff', 'admin']),
  [
    body('studentId').isString().trim(),
    body('phoneNumber').isString().trim(),
    body('deviceType').isString().trim(),
    body('brand').isString().trim(),
    body('model').isString().trim(),
    body('serialNumber').isString().trim(),
    body('macAddress').isString().trim(),
    body('ssid').optional().isString().trim()
  ],
  validationResultHandler,
  registerDevice
);

router.get('/', authMiddleware, requireRole(['staff', 'admin']), getAllDevices);

router.patch(
  '/:id/block',
  authMiddleware,
  requireRole(['staff', 'admin']),
  [param('id').isMongoId(), body('remarks').optional().isString().trim()],
  validationResultHandler,
  blockDevice
);


router.delete('/:id', authMiddleware, requireRole(['staff', 'admin']), [param('id').isMongoId()], validationResultHandler,deleteDeviceById);

export default router;

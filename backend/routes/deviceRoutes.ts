import { Router } from 'express';
import { body, param } from 'express-validator';
import { registerDevice, getAllDevices, blockDevice, deleteDeviceById } from '../controllers/deviceController';
import { authMiddleware, requireRole } from '../middleware/auth';
import { validationResultHandler } from './validationHelpers';

const router = Router();

// Security-only routes
router.post(
  '/register',
  authMiddleware,
  requireRole(['security']),
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

router.get('/', authMiddleware, requireRole(['security']), getAllDevices);

router.patch(
  '/:id/block',
  authMiddleware,
  requireRole(['security']),
  [param('id').isMongoId(), body('remarks').optional().isString().trim()],
  validationResultHandler,
  blockDevice
);

router.delete('/:id', authMiddleware, requireRole(['security']), [param('id').isMongoId()], validationResultHandler, deleteDeviceById);

export default router;

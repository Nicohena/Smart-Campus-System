import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createLocation,
  updateLocation,
  deleteLocation,
  getAllLocations,
  searchLocations,
  getLocationById,
  getLocationsByCategory
} from '../controllers/navigationController';
import { authMiddleware, requireRole } from '../middleware/auth';
import { validationResultHandler } from './validationHelpers';

const router = Router();

// Public (authenticated students)
router.get('/', authMiddleware, getAllLocations);
router.get('/search', authMiddleware, [query('q').optional().isString().trim(), query('category').optional().isString().trim()], validationResultHandler, searchLocations);
router.get('/category/:category', authMiddleware, [param('category').isString().trim()], validationResultHandler, getLocationsByCategory);
router.get('/:id', authMiddleware, [param('id').isMongoId()], validationResultHandler, getLocationById);

// Admin/Staff routes
router.post(
  '/',
  authMiddleware,
  requireRole(['staff', 'admin']),
  [
    body('name').isString().trim(),
    body('description').isString().trim(),
    body('category').isString().trim(),
    body('building').isString().trim(),
    body('latitude').isNumeric(),
    body('longitude').isNumeric(),
    body('floor').optional().isNumeric(),
    body('roomNumber').optional().isString().trim(),
    body('contactPerson').optional().isString().trim(),
    body('contactPhone').optional().isString().trim(),
    body('openHours').optional().isString().trim()
  ],
  validationResultHandler,
  createLocation
);

router.patch(
  '/:id',
  authMiddleware,
  requireRole(['staff', 'admin']),
  [param('id').isMongoId()],
  validationResultHandler,
  updateLocation
);

router.delete(
  '/:id',
  authMiddleware,
  requireRole(['staff', 'admin']),
  [param('id').isMongoId()],
  validationResultHandler,
  deleteLocation
);

export default router;

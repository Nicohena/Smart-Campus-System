import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body, param } from 'express-validator';
import { login, register, profile, refreshToken, logout, listUsers, getUserById, updateUser } from '../controllers/authController';
import { authMiddleware, requireRole } from '../middleware/auth';
import { validationResultHandler } from './validationHelpers';
import { STAFF_ROLES } from '../utils/roles';

const router = Router();

// Rate limiter for login to mitigate brute force
const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 10,
	standardHeaders: true,
	legacyHeaders: false
});

// Student login (also usable by staff/admin)
router.post(
	'/login',
	loginLimiter,
	[body('studentId').isString().trim().escape(), body('password').isString().trim().escape()],
	validationResultHandler,
	login
);

// Department creates students, admin creates staff users
router.post(
	'/register',
	authMiddleware,
	requireRole(['department', 'admin']),
	[
		body('name').isString().trim().escape(),
		body('studentId').isString().trim().escape(),
		body('password').isLength({ min: 8 }),
    body('department').optional().isString().trim().escape(),
    body('role').optional().isIn(STAFF_ROLES)
	],
	validationResultHandler,
	register
);

// Profile for logged-in user
router.get('/profile', authMiddleware, profile);
router.get('/users', authMiddleware, requireRole(['department', 'admin']), listUsers);
router.get('/users/:id', authMiddleware, requireRole(['department', 'admin']), [param('id').isMongoId()], validationResultHandler, getUserById);
router.patch('/users/:id', authMiddleware, requireRole(['department', 'admin']), [param('id').isMongoId()], validationResultHandler, updateUser);

// Refresh token endpoint
router.post('/refresh', [body('refreshToken').optional().isString().trim()], validationResultHandler, refreshToken);

// Logout (revoke refresh token)
router.post('/logout', authMiddleware, logout);

export default router;

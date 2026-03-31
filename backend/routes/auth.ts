import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import { login, register, profile, refreshToken, logout } from '../controllers/authController';
import { authMiddleware, requireRole } from '../middleware/auth';
import { validationResultHandler } from './validationHelpers';

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

// Register new users - only staff or admin can create users
router.post(
	'/register',
	authMiddleware,
	requireRole(['staff', 'admin']),
	[
		body('name').isString().trim().escape(),
		body('studentId').isString().trim().escape(),
		body('password').isLength({ min: 8 })
	],
	validationResultHandler,
	register
);

// Profile for logged-in user
router.get('/profile', authMiddleware, profile);

// Refresh token endpoint
router.post('/refresh', [body('refreshToken').optional().isString().trim()], validationResultHandler, refreshToken);

// Logout (revoke refresh token)
router.post('/logout', authMiddleware, logout);

export default router;

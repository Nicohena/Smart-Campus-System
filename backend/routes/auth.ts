import { Router } from 'express';
import { login, register, profile } from '../controllers/authController';
import { verifyToken, requireRole } from '../middleware/auth';

const router = Router();

// Student login (also usable by staff/admin)
router.post('/login', login);

// Register new users - only staff or admin can create users
router.post('/register', verifyToken, requireRole(['staff', 'admin']), register);

// Profile for logged-in user
router.get('/profile', verifyToken, profile);

export default router;

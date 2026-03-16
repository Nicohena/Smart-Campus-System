import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import { askAssistant } from '../controllers/chatController';
import { authMiddleware } from '../middleware/auth';
import { validationResultHandler } from './validationHelpers';

const router = Router();

// Rate limiter to prevent abuse of the AI assistant endpoint
const assistantLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  standardHeaders: true,
  legacyHeaders: false
});

// Authenticated users can ask the campus AI assistant
router.post(
  '/chat',
  assistantLimiter,
  authMiddleware,
  [body('message').isString().trim().isLength({ min: 1, max: 2000 })],
  validationResultHandler,
  askAssistant
);

export default router;

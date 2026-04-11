import { Router } from 'express';
import { param } from 'express-validator';
import { Request, Response } from 'express';
import Notification from '../models/Notification';
import { authMiddleware } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { validationResultHandler } from './validationHelpers';

const router = Router();

// GET /api/notifications — fetch current user's notifications
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { sendError(res, 'Unauthorized', 401); return; }
  const notifications = await Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(50);
  sendSuccess(res, 'Notifications fetched', { notifications });
});

// GET /api/notifications/unread-count
router.get('/unread-count', authMiddleware, async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { sendError(res, 'Unauthorized', 401); return; }
  const count = await Notification.countDocuments({ user: userId, isRead: false });
  sendSuccess(res, 'Unread count', { count });
});

// PATCH /api/notifications/:id/read
router.patch(
  '/:id/read',
  authMiddleware,
  [param('id').isMongoId()],
  validationResultHandler,
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const notif  = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { isRead: true },
      { new: true }
    );
    if (!notif) { sendError(res, 'Notification not found', 404); return; }
    sendSuccess(res, 'Marked as read', { notification: notif });
  }
);

// PATCH /api/notifications/read-all
router.patch('/read-all', authMiddleware, async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { sendError(res, 'Unauthorized', 401); return; }
  await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
  sendSuccess(res, 'All notifications marked as read', {});
});

export default router;

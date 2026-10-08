import { Router, Response } from 'express';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { db, NotificationEntity } from '../database/store';
import { successResponse, errorResponse } from '../utils/response';
import { io } from '../index';
import { sendNotification } from '../sockets';

const router = Router();

// @route   GET /api/notifications
// @desc    Get notifications for user
// @access  Private
router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const items = db.getNotifications(userId).map((item) => ({
      ...item,
      read: userId ? item.readBy.includes(userId) : false,
    }));
    return res.json(successResponse(items, 'Notifications loaded'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'NOTIFICATIONS_FAILED', 500));
  }
});

// @route   POST /api/notifications
// @desc    Create a notification
// @access  Private
router.post('/', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const item: NotificationEntity = {
      id: `n-${Date.now()}`,
      userId: req.body.userId ?? req.user?.id ?? 'all',
      title: String(req.body.title || 'AgriMarket Notification'),
      message: String(req.body.message || ''),
      href: req.body.href,
      category: req.body.category || 'System',
      readBy: [],
      createdAt: new Date().toISOString(),
    };

    const saved = db.addNotification(item);

    if (io) {
      if (item.userId === 'all') {
        io.emit('notification', saved);
      } else {
        sendNotification(io, Number(item.userId), saved);
      }
    }

    return res.status(201).json(successResponse(saved, 'Notification created'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'NOTIFICATION_CREATE_FAILED', 500));
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark single notification as read
// @access  Private
router.put('/:id/read', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    db.markNotificationRead(req.params.id, userId);
    return res.json(successResponse({ ok: true }, 'Marked read'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'READ_UPDATE_FAILED', 500));
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    db.markAllNotificationsRead(userId);
    return res.json(successResponse({ ok: true }, 'All notifications marked read'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'READ_ALL_FAILED', 500));
  }
});

export default router;

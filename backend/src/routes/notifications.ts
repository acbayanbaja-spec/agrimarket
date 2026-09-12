import { Router } from 'express';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { successResponse } from '../utils/response';

const router = Router();

type Notice = {
  id: string;
  userId: number | 'all';
  title: string;
  message: string;
  href?: string;
  category?: string;
  readBy: number[];
  createdAt: string;
};

const notices: Notice[] = [
  {
    id: 'n-welcome',
    userId: 'all',
    title: 'Harvest board is live',
    message: 'Follow a category to get pinged when sellers post.',
    href: '/feed',
    readBy: [],
    createdAt: new Date().toISOString(),
  },
];

router.get('/', authenticate, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const items = notices
    .filter((item) => item.userId === 'all' || item.userId === userId)
    .map((item) => ({
      ...item,
      read: userId ? item.readBy.includes(userId) : false,
    }));
  res.json(successResponse(items, 'Notifications loaded'));
});

router.post('/', authenticate, (req: AuthRequest, res) => {
  const item: Notice = {
    id: `n-${Date.now()}`,
    userId: req.body.userId ?? req.user?.id ?? 'all',
    title: String(req.body.title || 'AgriMarket'),
    message: String(req.body.message || ''),
    href: req.body.href,
    category: req.body.category,
    readBy: [],
    createdAt: new Date().toISOString(),
  };
  notices.unshift(item);
  res.status(201).json(successResponse(item, 'Notification created'));
});

router.put('/:id/read', authenticate, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const item = notices.find((entry) => entry.id === req.params.id);
  if (!item) {
    return res.status(404).json(successResponse(null, 'Notification not found'));
  }
  if (userId && !item.readBy.includes(userId)) item.readBy.push(userId);
  return res.json(successResponse({ ...item, read: true }, 'Marked read'));
});

router.put('/read-all', authenticate, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (userId) {
    notices.forEach((item) => {
      if ((item.userId === 'all' || item.userId === userId) && !item.readBy.includes(userId)) {
        item.readBy.push(userId);
      }
    });
  }
  res.json(successResponse({ ok: true }, 'All notifications marked read'));
});

export default router;

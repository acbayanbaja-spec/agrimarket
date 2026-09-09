import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', authenticate, (req, res) => {
  res.json({ message: 'Get notifications endpoint - to be implemented' });
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', authenticate, (req, res) => {
  res.json({ message: 'Mark notification as read endpoint - to be implemented' });
});

export default router;

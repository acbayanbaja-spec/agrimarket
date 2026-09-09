import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// @route   GET /api/messages/conversations
// @desc    Get user conversations
// @access  Private
router.get('/conversations', authenticate, (req, res) => {
  res.json({ message: 'Get conversations endpoint - to be implemented' });
});

// @route   GET /api/messages/conversations/:id
// @desc    Get conversation messages
// @access  Private
router.get('/conversations/:id', authenticate, (req, res) => {
  res.json({ message: 'Get conversation messages endpoint - to be implemented' });
});

export default router;

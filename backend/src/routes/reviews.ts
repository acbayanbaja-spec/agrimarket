import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// @route   GET /api/reviews/product/:productId
// @desc    Get reviews for a product
// @access  Public
router.get('/product/:productId', (req, res) => {
  res.json({ message: 'Get product reviews endpoint - to be implemented' });
});

// @route   POST /api/reviews
// @desc    Create a review
// @access  Private
router.post('/', authenticate, (req, res) => {
  res.json({ message: 'Create review endpoint - to be implemented' });
});

export default router;

import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// @route   GET /api/coupons
// @desc    Get available coupons
// @access  Public
router.get('/', (req, res) => {
  res.json({ message: 'Get coupons endpoint - to be implemented' });
});

// @route   POST /api/coupons/validate
// @desc    Validate coupon code
// @access  Private
router.post('/validate', authenticate, (req, res) => {
  res.json({ message: 'Validate coupon endpoint - to be implemented' });
});

export default router;

import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// @route   GET /api/delivery/deliveries
// @desc    Get delivery person's deliveries
// @access  Private (Delivery Man only)
router.get('/deliveries', authenticate, (req, res) => {
  res.json({ message: 'Get deliveries endpoint - to be implemented' });
});

// @route   PUT /api/delivery/deliveries/:id/status
// @desc    Update delivery status
// @access  Private (Delivery Man only)
router.put('/deliveries/:id/status', authenticate, (req, res) => {
  res.json({ message: 'Update delivery status endpoint - to be implemented' });
});

export default router;

import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// @route   POST /api/sellers/application
// @desc    Submit seller application
// @access  Private
router.post('/application', authenticate, (req, res) => {
  res.json({ message: 'Submit seller application endpoint - to be implemented' });
});

// @route   GET /api/sellers/application
// @desc    Get user seller application status
// @access  Private
router.get('/application', authenticate, (req, res) => {
  res.json({ message: 'Get seller application endpoint - to be implemented' });
});

// @route   GET /api/sellers/dashboard
// @desc    Get seller dashboard data
// @access  Private (Seller only)
router.get('/dashboard', authenticate, (req, res) => {
  res.json({ message: 'Get seller dashboard endpoint - to be implemented' });
});

export default router;

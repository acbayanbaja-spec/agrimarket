import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All admin routes require admin role
router.use(authenticate, authorize('admin'));

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard
// @access  Admin
router.get('/dashboard', (req, res) => {
  res.json({ message: 'Get admin dashboard endpoint - to be implemented' });
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', (req, res) => {
  res.json({ message: 'Get users endpoint - to be implemented' });
});

// @route   GET /api/admin/seller-applications
// @desc    Get seller applications
// @access  Admin
router.get('/seller-applications', (req, res) => {
  res.json({ message: 'Get seller applications endpoint - to be implemented' });
});

// @route   PUT /api/admin/seller-applications/:id
// @desc    Approve/reject seller application
// @access  Admin
router.put('/seller-applications/:id', (req, res) => {
  res.json({ message: 'Update seller application endpoint - to be implemented' });
});

export default router;

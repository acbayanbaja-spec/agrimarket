import { Router } from 'express';

const router = Router();

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', (req, res) => {
  res.json({ message: 'Get categories endpoint - to be implemented' });
});

// @route   GET /api/categories/:id
// @desc    Get category by ID
// @access  Public
router.get('/:id', (req, res) => {
  res.json({ message: 'Get category by ID endpoint - to be implemented' });
});

export default router;

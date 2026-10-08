import { Router, Request, Response } from 'express';
import { db } from '../database/store';
import { successResponse, errorResponse } from '../utils/response';

const router = Router();

// @route   GET /api/categories
// @desc    Get all agricultural categories
// @access  Public
router.get('/', (req: Request, res: Response) => {
  try {
    const categories = db.getCategories();
    const products = db.getProducts();

    // Attach product count to each category
    const enriched = categories.map((cat) => ({
      ...cat,
      productCount: products.filter((p) => p.category.toLowerCase() === cat.name.toLowerCase()).length,
    }));

    return res.json(successResponse(enriched, 'Categories retrieved successfully'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'CATEGORIES_FETCH_FAILED', 500));
  }
});

// @route   GET /api/categories/:id
// @desc    Get category by ID
// @access  Public
router.get('/:id', (req: Request, res: Response) => {
  try {
    const cat = db.getCategories().find((c) => c.id === req.params.id || c.name.toLowerCase() === req.params.id.toLowerCase());
    if (!cat) {
      return res.status(404).json(errorResponse('Category not found', null, 'NOT_FOUND', 404));
    }
    return res.json(successResponse(cat, 'Category retrieved'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'CATEGORY_FETCH_FAILED', 500));
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
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

// @route   POST /api/categories
// @desc    Create a new agricultural category
// @access  Admin
router.post('/', authenticate, authorize('admin'), (req: any, res: Response) => {
  try {
    const { name, description, icon, imageUrl } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json(errorResponse('Category name is required', null, 'BAD_REQUEST', 400));
    }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const created = db.addCategory({
      id: req.body.id || `cat-${slug}`,
      name: name.trim(),
      description: description?.trim() || 'Agricultural harvests and supplies',
      icon: icon?.trim() || 'Sprout',
      imageUrl: imageUrl?.trim() || '/images/farm.jpg',
    });

    db.addAuditLog({
      adminId: req.user?.id || 1,
      adminEmail: req.user?.email || 'admin@agrimarket.com',
      action: 'CATEGORY_CREATED',
      targetType: 'category',
      targetId: created.id,
      details: `Created category "${created.name}"`,
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.status(201).json(successResponse(created, 'Category created'));
  } catch (error: any) {
    return res.status(400).json(errorResponse(error.message, null, 'CATEGORY_CREATE_FAILED', 400));
  }
});

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Admin
router.put('/:id', authenticate, authorize('admin'), (req: any, res: Response) => {
  try {
    const updated = db.updateCategory(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json(errorResponse('Category not found', null, 'NOT_FOUND', 404));
    }

    db.addAuditLog({
      adminId: req.user?.id || 1,
      adminEmail: req.user?.email || 'admin@agrimarket.com',
      action: 'CATEGORY_UPDATED',
      targetType: 'category',
      targetId: req.params.id,
      details: `Updated category "${updated.name}"`,
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.json(successResponse(updated, 'Category updated'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'CATEGORY_UPDATE_FAILED', 500));
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Admin
router.delete('/:id', authenticate, authorize('admin'), (req: any, res: Response) => {
  try {
    const ok = db.deleteCategory(req.params.id);
    if (!ok) {
      return res.status(404).json(errorResponse('Category not found', null, 'NOT_FOUND', 404));
    }

    db.addAuditLog({
      adminId: req.user?.id || 1,
      adminEmail: req.user?.email || 'admin@agrimarket.com',
      action: 'CATEGORY_DELETED',
      targetType: 'category',
      targetId: req.params.id,
      details: `Deleted category "${req.params.id}"`,
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.json(successResponse({ id: req.params.id }, 'Category deleted'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'CATEGORY_DELETE_FAILED', 500));
  }
});

export default router;

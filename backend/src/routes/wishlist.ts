import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { db } from '../database/store';
import { successResponse, errorResponse } from '../utils/response';

const router = Router();

router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const items = db.getWishlist(req.user!.id);
    return res.json(successResponse({ productIds: items }, 'Wishlist retrieved'));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json(errorResponse(error.message, null, error.code || 'WISHLIST_FETCH_FAILED', statusCode));
  }
});

router.post('/:productId', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const product = db.getProductById(req.params.productId);
    if (!product || product.isDeleted) {
      return res.status(404).json(errorResponse('Product not found', null, 'NOT_FOUND', 404));
    }
    const productIds = db.addToWishlist(req.user!.id, req.params.productId);
    return res.status(201).json(successResponse({ productIds }, 'Saved to wishlist'));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json(errorResponse(error.message, null, error.code || 'WISHLIST_ADD_FAILED', statusCode));
  }
});

router.delete('/:productId', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const productIds = db.removeFromWishlist(req.user!.id, req.params.productId);
    return res.json(successResponse({ productIds }, 'Removed from wishlist'));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json(errorResponse(error.message, null, error.code || 'WISHLIST_REMOVE_FAILED', statusCode));
  }
});

export default router;

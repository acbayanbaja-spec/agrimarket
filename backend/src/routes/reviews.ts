import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { db, ReviewEntity } from '../database/store';
import { successResponse, errorResponse } from '../utils/response';

const router = Router();

// @route   GET /api/reviews/product/:productId
// @desc    Get reviews for a product with aggregate ratings
// @access  Public
router.get('/product/:productId', (req: Request, res: Response) => {
  try {
    const reviews = db.getReviewsForProduct(req.params.productId);
    const averageRating =
      reviews.length > 0 ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)) : 5.0;

    return res.json(
      successResponse(
        {
          reviews,
          total: reviews.length,
          averageRating,
        },
        'Reviews retrieved successfully'
      )
    );
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'REVIEWS_FETCH_FAILED', 500));
  }
});

// @route   POST /api/reviews
// @desc    Create a product review
// @access  Private
router.post('/', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { productId, rating, comment, photos } = req.body;

    if (!productId || !rating) {
      return res.status(400).json(errorResponse('Product ID and rating are required', null, 'BAD_REQUEST', 400));
    }

    const fullUser = db.getUserById(user.id);
    const displayName = fullUser ? `${fullUser.first_name} ${fullUser.last_name}`.trim() : user.email.split('@')[0];

    const newReview: ReviewEntity = {
      id: `rev-${Date.now()}`,
      productId,
      userId: user.id,
      userName: displayName || 'Verified Buyer',
      rating: Number(rating),
      comment: String(comment || ''),
      photos: Array.isArray(photos) ? photos : [],
      status: 'published',
      createdAt: new Date().toISOString(),
    };

    const created = db.addReview(newReview);
    return res.status(201).json(successResponse(created, 'Review submitted successfully'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'REVIEW_CREATION_FAILED', 500));
  }
});

// @route   GET /api/reviews
// @desc    Get all reviews across marketplace (Admin)
// @access  Admin
router.get('/', authenticate, authorize('admin'), (req: AuthRequest, res: Response) => {
  try {
    const reviews = db.getAllReviews();
    return res.json(successResponse(reviews, 'All reviews retrieved'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'REVIEWS_FETCH_FAILED', 500));
  }
});

// @route   PUT /api/reviews/:id/moderate
// @desc    Moderate review (publish, hide, flag)
// @access  Admin
router.put('/:id/moderate', authenticate, authorize('admin'), (req: AuthRequest, res: Response) => {
  try {
    const { status, reason } = req.body;
    const updated = db.moderateReview(req.params.id, status, reason);
    if (!updated) {
      return res.status(404).json(errorResponse('Review not found', null, 'NOT_FOUND', 404));
    }

    db.addAuditLog({
      adminId: req.user?.id || 1,
      adminEmail: req.user?.email || 'admin@agrimarket.com',
      action: 'REVIEW_MODERATED',
      targetType: 'review',
      targetId: req.params.id,
      details: `Moderated review ID "${req.params.id}" to status "${status}". Reason: "${reason || 'N/A'}"`,
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.json(successResponse(updated, 'Review moderated successfully'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'REVIEW_MODERATION_FAILED', 500));
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete review
// @access  Admin
router.delete('/:id', authenticate, authorize('admin'), (req: AuthRequest, res: Response) => {
  try {
    const ok = db.deleteReview(req.params.id);
    if (!ok) {
      return res.status(404).json(errorResponse('Review not found', null, 'NOT_FOUND', 404));
    }

    db.addAuditLog({
      adminId: req.user?.id || 1,
      adminEmail: req.user?.email || 'admin@agrimarket.com',
      action: 'REVIEW_DELETED',
      targetType: 'review',
      targetId: req.params.id,
      details: `Deleted review ID "${req.params.id}"`,
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.json(successResponse({ id: req.params.id }, 'Review deleted successfully'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'REVIEW_DELETE_FAILED', 500));
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
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
      createdAt: new Date().toISOString(),
    };

    const created = db.addReview(newReview);
    return res.status(201).json(successResponse(created, 'Review submitted successfully'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'REVIEW_CREATION_FAILED', 500));
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { db } from '../database/store';
import { successResponse, errorResponse } from '../utils/response';

const router = Router();

// @route   GET /api/coupons
// @desc    Get active coupons and vouchers
// @access  Public
router.get('/', (req: Request, res: Response) => {
  try {
    const coupons = db.getCoupons();
    return res.json(successResponse(coupons, 'Coupons retrieved successfully'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'COUPONS_FETCH_FAILED', 500));
  }
});

// @route   POST /api/coupons/validate
// @desc    Validate coupon code and return calculated discount
// @access  Public / Authenticated
router.post('/validate', (req: Request, res: Response) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) {
      return res.status(400).json(errorResponse('Coupon code is required', null, 'MISSING_CODE', 400));
    }

    const result = db.validateCoupon(code, Number(subtotal || 0));
    if (!result.valid) {
      return res.status(400).json(errorResponse(result.message, null, 'INVALID_COUPON', 400));
    }

    return res.json(successResponse(result, 'Coupon is valid'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'COUPON_VALIDATION_FAILED', 500));
  }
});

export default router;

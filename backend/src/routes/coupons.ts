import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
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

// @route   POST /api/coupons
// @desc    Create promo discount (Admin)
// @access  Admin
router.post('/', authenticate, authorize('admin'), (req: any, res: Response) => {
  try {
    const { code, discount, type, minSpend, description, isActive } = req.body;
    if (!code || !discount) {
      return res.status(400).json(errorResponse('Code and discount required', null, 'BAD_REQUEST', 400));
    }

    const created = db.addCoupon({
      code: code.trim().toUpperCase(),
      discount: Number(discount),
      type: type || 'fixed',
      minSpend: Number(minSpend || 0),
      description: description || `${code} discount`,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    db.addAuditLog({
      adminId: req.user?.id || 1,
      adminEmail: req.user?.email || 'admin@agrimarket.com',
      action: 'PROMOTION_CREATED',
      targetType: 'promotion',
      targetId: created.code,
      details: `Created promotion "${created.code}"`,
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.status(201).json(successResponse(created, 'Promotion created'));
  } catch (error: any) {
    return res.status(400).json(errorResponse(error.message, null, 'COUPON_CREATE_FAILED', 400));
  }
});

// @route   PUT /api/coupons/:code
// @desc    Update promo discount (Admin)
// @access  Admin
router.put('/:code', authenticate, authorize('admin'), (req: any, res: Response) => {
  try {
    const updated = db.updateCoupon(req.params.code, req.body);
    if (!updated) {
      return res.status(404).json(errorResponse('Coupon not found', null, 'NOT_FOUND', 404));
    }

    db.addAuditLog({
      adminId: req.user?.id || 1,
      adminEmail: req.user?.email || 'admin@agrimarket.com',
      action: 'PROMOTION_UPDATED',
      targetType: 'promotion',
      targetId: req.params.code,
      details: `Updated promotion "${req.params.code}"`,
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.json(successResponse(updated, 'Promotion updated'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'COUPON_UPDATE_FAILED', 500));
  }
});

// @route   DELETE /api/coupons/:code
// @desc    Delete promo discount (Admin)
// @access  Admin
router.delete('/:code', authenticate, authorize('admin'), (req: any, res: Response) => {
  try {
    const ok = db.deleteCoupon(req.params.code);
    if (!ok) {
      return res.status(404).json(errorResponse('Coupon not found', null, 'NOT_FOUND', 404));
    }

    db.addAuditLog({
      adminId: req.user?.id || 1,
      adminEmail: req.user?.email || 'admin@agrimarket.com',
      action: 'PROMOTION_DELETED',
      targetType: 'promotion',
      targetId: req.params.code,
      details: `Deleted promotion "${req.params.code}"`,
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.json(successResponse({ code: req.params.code }, 'Promotion deleted'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'COUPON_DELETE_FAILED', 500));
  }
});

export default router;

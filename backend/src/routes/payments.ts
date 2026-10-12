import { Router, Response } from 'express';
import { paymentService } from '../services/paymentService';
import { authenticate, AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { db } from '../database/store';

const router = Router();

// @route   POST /api/payments/checkout
// @desc    Initiate GCash / Maya digital payment session for an order
// @access  Private (Buyer / Admin)
router.post('/checkout', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { orderId, paymentMethod, buyerPhone } = req.body;
    if (!orderId || !paymentMethod) {
      return res.status(400).json(errorResponse('orderId and paymentMethod are required', null, 'BAD_REQUEST', 400));
    }

    const order = db.getOrderById(orderId);
    if (!order) {
      return res.status(404).json(errorResponse('Order not found', null, 'NOT_FOUND', 404));
    }

    const user = req.user!;
    const isAdmin = user.roles.includes('admin');
    const isBuyer = order.userId === user.id;

    if (!isAdmin && !isBuyer) {
      return res.status(403).json(errorResponse('You can only initiate payment for your own orders', null, 'FORBIDDEN', 403));
    }

    const session = paymentService.createCheckoutSession({
      orderId,
      amount: order.total,
      paymentMethod,
      buyerEmail: user.email,
      buyerPhone: buyerPhone || order.buyerPhone,
    });

    return res.status(200).json(successResponse(session, 'Checkout session initialized'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'CHECKOUT_FAILED', 500));
  }
});

// @route   POST /api/payments/verify
// @desc    Verify incoming digital payment and hold funds in escrow
// @access  Private (Buyer / Admin)
router.post('/verify', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { orderId, transactionRef } = req.body;
    if (!orderId) {
      return res.status(400).json(errorResponse('orderId is required', null, 'BAD_REQUEST', 400));
    }

    const order = db.getOrderById(orderId);
    if (!order) {
      return res.status(404).json(errorResponse('Order not found', null, 'NOT_FOUND', 404));
    }

    const user = req.user!;
    const isAdmin = user.roles.includes('admin');
    const isBuyer = order.userId === user.id;

    if (!isAdmin && !isBuyer) {
      return res.status(403).json(errorResponse('Unauthorized to verify payment for this order', null, 'FORBIDDEN', 403));
    }

    const result = paymentService.verifyPayment(orderId, transactionRef);
    return res.json(successResponse(result, 'Payment verified and secured in escrow'));
  } catch (error: any) {
    return res.status(400).json(errorResponse(error.message, null, 'PAYMENT_VERIFICATION_FAILED', 400));
  }
});

// @route   POST /api/payments/escrow/release
// @desc    Release escrow funds to farmer after delivery confirmation
// @access  Private (Buyer / Admin)
router.post('/escrow/release', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json(errorResponse('Order ID required', null, 'BAD_REQUEST', 400));
    }

    const order = db.getOrderById(orderId);
    if (!order) {
      return res.status(404).json(errorResponse('Order not found', null, 'NOT_FOUND', 404));
    }

    const user = req.user!;
    const isAdmin = user.roles.includes('admin');
    const isBuyer = order.userId === user.id;

    if (!isAdmin && !isBuyer) {
      return res.status(403).json(errorResponse('Only the purchasing buyer or an administrator can release escrow funds', null, 'FORBIDDEN', 403));
    }

    const result = paymentService.releaseEscrow(orderId, user.id);
    return res.json(successResponse(result, 'Escrow funds successfully disbursed to seller'));
  } catch (error: any) {
    return res.status(400).json(errorResponse(error.message, null, 'ESCROW_RELEASE_FAILED', 400));
  }
});

export default router;

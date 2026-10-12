import { Router, Response, Request } from 'express';
import { paymentService } from '../services/paymentService';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { db } from '../database/store';

const router = Router();

// @route   POST /api/payments/checkout
// @desc    Initiate digital payment session for an order
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

// @route   POST /api/payments/webhook
// @desc    Receive verified payment provider callback (PayMongo / GCash / Maya)
// @access  Public (Protected via cryptographic HMAC signature)
router.post('/webhook', (req: Request, res: Response) => {
  try {
    const signature = (req.headers['x-signature'] || req.headers['paymongo-signature']) as string | undefined;
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const result = paymentService.handleProviderWebhook(rawBody, signature, req.body);
    return res.json(successResponse(result, 'Webhook processed successfully'));
  } catch (error: any) {
    return res.status(400).json(errorResponse(error.message, null, 'WEBHOOK_VERIFICATION_FAILED', 400));
  }
});

// @route   POST /api/payments/escrow/release
// @desc    Release escrow funds to seller after delivery confirmation
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

// @route   POST /api/payments/refund
// @desc    Process refund for an order (Admin only)
// @access  Private (Admin)
router.post('/refund', authenticate, authorize('admin'), (req: AuthRequest, res: Response) => {
  try {
    const { orderId, reason } = req.body;
    if (!orderId) {
      return res.status(400).json(errorResponse('orderId is required', null, 'BAD_REQUEST', 400));
    }

    const result = paymentService.processRefund(orderId, req.user!.id, reason || 'Admin initiated refund');
    return res.json(successResponse(result, 'Payment refunded successfully'));
  } catch (error: any) {
    return res.status(400).json(errorResponse(error.message, null, 'REFUND_FAILED', 400));
  }
});

export default router;

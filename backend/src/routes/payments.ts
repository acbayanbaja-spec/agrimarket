import { Router, Request, Response } from 'express';
import { paymentService } from '../services/paymentService';
import { authenticate, AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';

const router = Router();

// @route   POST /api/payments/checkout
// @desc    Initiate GCash / Maya digital payment session
// @access  Public / Authenticated
router.post('/checkout', (req: Request, res: Response) => {
  try {
    const { orderId, amount, paymentMethod, buyerEmail, buyerPhone } = req.body;
    if (!orderId || !amount || !paymentMethod) {
      return res.status(400).json(errorResponse('Missing checkout requirements', null, 'BAD_REQUEST', 400));
    }

    const session = paymentService.createCheckoutSession({
      orderId,
      amount: Number(amount),
      paymentMethod,
      buyerEmail: buyerEmail || 'buyer@agrimarket.com',
      buyerPhone,
    });

    return res.status(200).json(successResponse(session, 'Checkout session initialized'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'CHECKOUT_FAILED', 500));
  }
});

// @route   POST /api/payments/escrow/release
// @desc    Release escrow funds to farmer after delivery confirmation
// @access  Private
router.post('/escrow/release', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json(errorResponse('Order ID required', null, 'BAD_REQUEST', 400));
    }

    const result = paymentService.releaseEscrow(orderId, req.user!.id);
    return res.json(successResponse(result, 'Escrow funds successfully disbursed to seller'));
  } catch (error: any) {
    return res.status(400).json(errorResponse(error.message, null, 'ESCROW_RELEASE_FAILED', 400));
  }
});

export default router;

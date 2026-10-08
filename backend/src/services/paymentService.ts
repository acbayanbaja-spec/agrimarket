import { db } from '../database/store';

export interface CheckoutSessionPayload {
  orderId: string;
  amount: number;
  paymentMethod: 'GCash' | 'Maya' | 'Card' | 'Cash on delivery';
  buyerEmail: string;
  buyerPhone?: string;
}

export const paymentService = {
  createCheckoutSession(payload: CheckoutSessionPayload) {
    const transactionRef = `TXN-${payload.paymentMethod.toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const qrPhCode = `00020101021226580014ph.com.agrimarket0110${transactionRef}520459995303608540${payload.amount.toFixed(2)}5802PH5915AGRIMARKET_PH6007KORONADAL6304`;

    const status = payload.paymentMethod === 'Cash on delivery' ? 'pending' : 'escrow_held';

    // Update order with reference
    db.updateOrderStatus(payload.orderId, 'Confirmed', {
      payment: payload.paymentMethod,
      paymentRef: transactionRef,
      paymentStatus: status,
    });

    return {
      transactionRef,
      orderId: payload.orderId,
      amount: payload.amount,
      paymentMethod: payload.paymentMethod,
      status,
      escrowProtected: true,
      qrPhCode,
      checkoutUrl: `https://checkout.agrimarket.ph/pay/${transactionRef}`,
      message: 'Payment secured in AgriMarket Escrow. Funds will be released to farmer upon buyer verification.',
    };
  },

  releaseEscrow(orderId: string, verifiedByUserId: number) {
    const order = db.getOrderById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    db.updateOrderStatus(orderId, 'Delivered', {
      paymentStatus: 'paid',
    });

    return {
      orderId,
      status: 'paid',
      releasedAt: new Date().toISOString(),
      verifiedByUserId,
      message: 'Escrow released! Payout transferred to farmer account.',
    };
  },
};

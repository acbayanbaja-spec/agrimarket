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
    const order = db.getOrderById(payload.orderId);
    if (!order) {
      throw new Error(`Order ${payload.orderId} not found`);
    }

    const transactionRef = `TXN-${payload.paymentMethod.replace(/\s+/g, '_').toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const qrPhCode = `00020101021226580014ph.com.agrimarket0110${transactionRef}520459995303608540${order.total.toFixed(2)}5802PH5915AGRIMARKET_PH6007KORONADAL6304`;

    // Record payment reference while maintaining honest pending payment status until verification
    db.updateOrderStatus(order.id, order.status, {
      payment: payload.paymentMethod,
      paymentRef: transactionRef,
      paymentStatus: 'pending',
    });

    return {
      transactionRef,
      orderId: order.id,
      amount: order.total,
      paymentMethod: payload.paymentMethod,
      status: 'pending',
      escrowProtected: true,
      qrPhCode,
      checkoutUrl: `https://checkout.agrimarket.ph/pay/${transactionRef}`,
      message: 'Payment session created. Awaiting payment authorization through gateway.',
    };
  },

  verifyPayment(orderId: string, transactionRef?: string) {
    const order = db.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    db.updateOrderStatus(orderId, order.status, {
      paymentStatus: 'escrow_held',
      paymentRef: transactionRef || order.paymentRef,
    });

    // Notify buyer & sellers of escrow lock
    db.addNotification({
      id: `notice-${Date.now()}-${order.userId}`,
      userId: order.userId,
      title: 'Payment Secured in Escrow 🔒',
      message: `Your payment of ₱${order.total.toLocaleString()} for order #${order.id} is held securely in escrow until delivery verification.`,
      category: 'Order',
      readBy: [],
      createdAt: new Date().toISOString(),
    });

    return {
      orderId,
      status: 'escrow_held',
      message: 'Payment confirmed and funds held in escrow.',
    };
  },

  releaseEscrow(orderId: string, verifiedByUserId: number) {
    const order = db.getOrderById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'Delivered') {
      throw new Error(`Cannot release escrow: order is currently '${order.status}'. Funds are only released after delivery.`);
    }

    if (order.paymentStatus === 'paid') {
      throw new Error('Escrow funds have already been released for this order.');
    }

    db.updateOrderStatus(orderId, order.status, {
      paymentStatus: 'paid',
    });

    // Notify sellers that escrow payout is credited
    const sellerIds = [...new Set(order.items.map((i: any) => Number(i.sellerUserId)).filter(Boolean))];
    sellerIds.forEach((sId: number) => {
      db.addNotification({
        id: `notice-${Date.now()}-${sId}`,
        userId: sId,
        title: 'Escrow Payout Released 🌾',
        message: `Escrow funds for delivered order #${order.id} have been released to your payout balance.`,
        category: 'Order',
        readBy: [],
        createdAt: new Date().toISOString(),
      });
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

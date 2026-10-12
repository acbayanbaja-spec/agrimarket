import crypto from 'crypto';
import { db } from '../database/store';

export interface CheckoutSessionPayload {
  orderId: string;
  amount: number;
  paymentMethod: 'GCash' | 'Maya' | 'Card' | 'Cash on delivery';
  buyerEmail: string;
  buyerPhone?: string;
}

export interface WebhookPayload {
  eventId: string;
  orderId: string;
  transactionRef: string;
  amount: number;
  currency?: string;
  status: 'paid' | 'failed';
  signature?: string;
}

export const paymentService = {
  isProviderConfigured(): boolean {
    const isLive = process.env.PAYMENT_PROVIDER_LIVE === 'true';
    const apiKey = process.env.PAYMENT_API_KEY;
    const secret = process.env.PAYMENT_SECRET;
    return Boolean(isLive && apiKey && secret && !apiKey.includes('mock') && !secret.includes('mock'));
  },

  createCheckoutSession(payload: CheckoutSessionPayload) {
    const order = db.getOrderById(payload.orderId);
    if (!order) {
      throw new Error(`Order ${payload.orderId} not found`);
    }

    const providerConfigured = this.isProviderConfigured();
    if (order.paymentRef && order.paymentStatus === 'pending' && (!order.payment || order.payment === payload.paymentMethod)) {
      return {
        orderId: order.id,
        transactionRef: order.paymentRef,
        amount: order.total,
        paymentMethod: payload.paymentMethod,
        status: 'pending',
        isLiveGateway: providerConfigured,
        providerConfigured,
        simulationNotice: providerConfigured
          ? null
          : 'Payment provider credentials not configured. Checkout is in simulation/pending mode. Funds will not be marked as escrow-held without live settlement.',
        checkoutUrl: providerConfigured ? `https://checkout.agrimarket.ph/pay/${order.paymentRef}` : null,
        idempotent: true,
      };
    }
    const transactionRef = `TXN-${payload.paymentMethod.replace(/\s+/g, '_').toUpperCase()}-${Date.now().toString().slice(-6)}`;

    // Honest persistence: paymentStatus remains pending
    db.updateOrderStatus(order.id, order.status, {
      payment: payload.paymentMethod,
      paymentRef: transactionRef,
      paymentStatus: 'pending',
    });

    if (!providerConfigured) {
      return {
        orderId: order.id,
        transactionRef,
        amount: order.total,
        paymentMethod: payload.paymentMethod,
        status: 'pending',
        isLiveGateway: false,
        providerConfigured: false,
        simulationNotice:
          'Payment provider credentials not configured. Checkout is in simulation/pending mode. Funds will not be marked as escrow-held without live settlement.',
        checkoutUrl: null,
      };
    }

    // Live provider integration (when real credentials configured)
    return {
      orderId: order.id,
      transactionRef,
      amount: order.total,
      paymentMethod: payload.paymentMethod,
      status: 'pending',
      isLiveGateway: true,
      providerConfigured: true,
      simulationNotice: null,
      checkoutUrl: `https://checkout.agrimarket.ph/pay/${transactionRef}`,
    };
  },

  handleProviderWebhook(rawBody: string, signature: string | undefined, payload: WebhookPayload) {
    if (!this.isProviderConfigured()) {
      throw new Error('Payment webhook rejected: Live payment provider is not configured.');
    }

    const webhookSecret = process.env.PAYMENT_SECRET || '';
    if (!signature || !webhookSecret) {
      throw new Error('Missing or invalid webhook signature.');
    }

    // Cryptographic signature verification (HMAC SHA-256 supporting PayMongo timestamped & standard raw signatures)
    let isValidSignature = false;
    if (signature.includes('t=') && (signature.includes('te=') || signature.includes('li='))) {
      // Documented PayMongo signature format: t=<timestamp>,te=<test_sig>,li=<live_sig>
      const parts = signature.split(',').reduce((acc: any, part) => {
        const [k, v] = part.split('=');
        if (k && v) acc[k.trim()] = v.trim();
        return acc;
      }, {});
      const timestamp = parts.t;
      const targetSig = parts.li || parts.te;
      if (timestamp && targetSig) {
        const payloadToSign = `${timestamp}.${rawBody}`;
        const computed = crypto.createHmac('sha256', webhookSecret).update(payloadToSign).digest('hex');
        const sigBuf = Buffer.from(targetSig);
        const compBuf = Buffer.from(computed);
        if (sigBuf.length === compBuf.length && crypto.timingSafeEqual(sigBuf, compBuf)) {
          isValidSignature = true;
        }
      }
    } else {
      // Standard HMAC SHA-256 signature
      const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expectedSignature);
      if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
        isValidSignature = true;
      }
    }

    if (!isValidSignature) {
      throw new Error('Webhook cryptographic signature verification failed.');
    }

    // Validate Event ID
    if (!payload.eventId || typeof payload.eventId !== 'string' || payload.eventId.trim().length === 0) {
      throw new Error('Missing or invalid eventId in webhook payload.');
    }

    // Prevent duplicate callback replay attacks with durable database persistence across restarts
    if (db.isWebhookProcessed(payload.eventId)) {
      throw new Error(`Duplicate webhook event rejected: ${payload.eventId}`);
    }

    // Validate Order ID
    if (!payload.orderId || typeof payload.orderId !== 'string') {
      throw new Error('Missing or invalid orderId in webhook payload.');
    }

    const order = db.getOrderById(payload.orderId);
    if (!order) {
      throw new Error(`Order ${payload.orderId} not found for webhook.`);
    }

    // Validate Currency: SOCCSKSARGEN / Philippine agricultural transactions must strictly be in PHP
    if (payload.currency && payload.currency.toUpperCase() !== 'PHP') {
      throw new Error(`Invalid currency "${payload.currency}": AgriMarket only processes payments in PHP.`);
    }

    // Validate Transaction Reference
    if (!payload.transactionRef || typeof payload.transactionRef !== 'string') {
      throw new Error('Missing or invalid transactionRef in webhook payload.');
    }

    // Prevent amount mismatch tampering
    if (Math.abs(order.total - Number(payload.amount)) > 0.01) {
      throw new Error(`Webhook amount mismatch: order total is ₱${order.total}, webhook received ₱${payload.amount}.`);
    }

    // Validate payment state
    if (payload.status !== 'paid' && payload.status !== 'failed') {
      throw new Error(`Invalid payment state: "${payload.status}".`);
    }

    // Durably record the processed webhook event ID
    db.addProcessedWebhook(payload.eventId, payload.orderId);

    if (payload.status === 'paid') {
      db.updateOrderStatus(order.id, order.status, {
        paymentStatus: 'escrow_held',
        paymentRef: payload.transactionRef,
      });

      db.addNotification({
        id: `notice-${Date.now()}-${order.userId}`,
        userId: order.userId,
        title: 'Payment Confirmed by Provider',
        message: `Your payment of ₱${order.total.toLocaleString()} for order #${order.id} was verified by the payment gateway and held securely in escrow.`,
        category: 'Order',
        readBy: [],
        createdAt: new Date().toISOString(),
      });

      return { success: true, orderId: order.id, status: 'escrow_held' };
    }

    return { success: false, orderId: order.id, status: 'failed' };
  },

  releaseEscrow(orderId: string, verifiedByUserId: number) {
    const order = db.getOrderById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Delivery completion must be strictly separate from payment confirmation
    if (order.status !== 'Delivered') {
      throw new Error(`Cannot release escrow: order is currently '${order.status}'. Funds are only released after delivery.`);
    }

    // Never claim funds are in escrow or released unless a real settlement confirmed this
    if (order.paymentStatus !== 'escrow_held') {
      throw new Error(
        `Cannot release escrow: payment status is '${order.paymentStatus || 'pending'}'. Only payments confirmed into escrow by a verified provider can be released.`
      );
    }

    db.updateOrderStatus(orderId, order.status, {
      paymentStatus: 'paid',
    });

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
      message: 'Escrow released! Settlement disbursed to seller.',
    };
  },

  processRefund(orderId: string, adminUserId: number, reason: string) {
    const order = db.getOrderById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.paymentStatus !== 'paid' && order.paymentStatus !== 'escrow_held') {
      throw new Error(`Cannot refund order with payment status '${order.paymentStatus || 'pending'}'.`);
    }

    db.updateOrderStatus(orderId, order.status, {
      paymentStatus: 'refunded',
    });

    db.addAuditLog({
      adminId: adminUserId,
      adminEmail: 'admin@agrimarket.com',
      action: 'PAYMENT_REFUNDED',
      targetType: 'order',
      targetId: orderId,
      details: `Refunded payment for order ${orderId}. Reason: ${reason}`,
      ipAddress: '127.0.0.1',
    });

    return {
      orderId,
      status: 'refunded',
      refundedAt: new Date().toISOString(),
      refundedBy: adminUserId,
      reason,
    };
  },
};

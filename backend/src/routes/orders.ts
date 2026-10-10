import { Router, Response } from 'express';
import { optionalAuth, authenticate, AuthRequest } from '../middleware/auth';
import { db, OrderEntity, DeliveryJobEntity } from '../database/store';
import { successResponse, errorResponse } from '../utils/response';
import { io } from '../index';
import { sendOrderUpdate, sendDeliveryUpdate } from '../sockets';

const router = Router();

// @route   GET /api/orders
// @desc    Get user orders or seller/admin orders
// @access  Public / Optional Auth
router.get('/', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      const allOrders = db.getOrders();
      return res.json(successResponse(allOrders, 'Orders retrieved successfully'));
    }

    const isSeller = user.roles.includes('seller');
    const isAdmin = user.roles.includes('admin');
    const isDriver = user.roles.includes('delivery');

    let orders: OrderEntity[] = [];

    if (isAdmin) {
      orders = db.getOrders();
    } else if (isSeller) {
      // Return both buyer orders and incoming seller orders
      const buyerOrders = db.getOrdersByUserId(user.id);
      const sellerOrders = db.getOrdersBySellerId(`seller-${user.id}`, user.id);
      const map = new Map<string, OrderEntity>();
      [...buyerOrders, ...sellerOrders].forEach((o) => map.set(o.id, o));
      orders = Array.from(map.values());
    } else if (isDriver) {
      orders = db.getOrders().filter((o) => o.driverId === user.id || o.status === 'Shipped' || o.status === 'Out for delivery');
    } else {
      orders = db.getOrdersByUserId(user.id);
    }

    return res.json(successResponse(orders, 'Orders retrieved successfully'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'ORDERS_FETCH_FAILED', 500));
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID or receipt number
// @access  Public / Optional Auth
router.get('/:id', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const order = db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json(errorResponse('Order not found', null, 'NOT_FOUND', 404));
    }

    return res.json(successResponse(order, 'Order retrieved successfully'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'ORDER_FETCH_FAILED', 500));
  }
});

// @route   POST /api/orders
// @desc    Create new order in centralized database and notify seller & all devices
// @access  Public / Optional Auth
router.post('/', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;
    const user = req.user || {
      id: Number(body.userId) || 3,
      email: body.buyerEmail || 'buyer@agrimarket.com',
      roles: ['buyer'],
    };

    if (user.roles && user.roles.includes('admin')) {
      return res.status(403).json(errorResponse('Administrators cannot place orders. The admin role is for platform management only.', null, 'ADMIN_CANNOT_ORDER', 403));
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return res.status(400).json(errorResponse('Order must contain at least one item', null, 'INVALID_ITEMS', 400));
    }

    const orderId = body.id || `ORD-${Date.now().toString().slice(-6)}`;
    const receiptNo = body.receiptNo || `RCPT-${Date.now().toString().slice(-6)}`;

    // Calculate subtotal
    const subtotal = body.items.reduce((sum: number, it: any) => sum + Number(it.price) * Number(it.quantity), 0);
    const shippingFee = Number(body.shippingFee ?? 50);
    const shippingDiscount = Number(body.shippingDiscount ?? (body.couponCode === 'FREESHIP' ? 50 : 0));
    const pointsRedeemed = Number(body.pointsRedeemed ?? 0);
    const total = Number(body.total ?? Math.max(0, subtotal + shippingFee - shippingDiscount - pointsRedeemed));
    const pointsEarned = Math.floor(subtotal / 10);

    const newOrder: OrderEntity = {
      id: orderId,
      receiptNo,
      userId: user.id,
      buyerName: body.buyerName || `${user.email.split('@')[0]}`,
      buyerPhone: body.buyerPhone || '+639180000000',
      items: body.items,
      subtotal,
      shippingFee,
      shippingDiscount,
      couponCode: body.couponCode,
      pointsEarned,
      pointsRedeemed,
      total,
      status: 'Pending',
      createdAt: body.createdAt || new Date().toISOString(),
      address: body.address || 'SOCCSKSARGEN Delivery Address',
      payment: body.payment || 'GCash',
      paymentRef: body.paymentRef || `GC-${Date.now().toString().slice(-4)}`,
      paymentStatus: body.payment === 'GCash' || body.payment === 'Maya' ? 'escrow_held' : 'pending',
      lat: body.lat || 6.5004,
      lng: body.lng || 124.8436,
    };

    // Deduct stock for each product in centralized database
    body.items.forEach((item: any) => {
      const prod = db.getProductById(item.productId);
      if (prod) {
        const nextStock = Math.max(0, prod.stock - item.quantity);
        db.updateProduct(prod.id, { stock: nextStock });
      }
    });

    const created = db.addOrder(newOrder);

    // INSTANT BROADCAST TO ALL DEVICES: buyer, seller, rider, admin
    if (io) {
      io.emit('order_created', created);
      io.emit('new_order', created);
      sendOrderUpdate(io, user.id, created);
      const sellerUserIds = [...new Set(newOrder.items.map((i: any) => Number(i.sellerUserId)).filter(Boolean))];
      sellerUserIds.forEach((sId: number) => {
        sendOrderUpdate(io, sId, created);
      });
    }

    return res.status(201).json(successResponse(created, 'Order placed successfully and dispatched to seller'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'ORDER_CREATION_FAILED', 500));
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status centrally (Confirmed by seller, Shipped, Out for delivery, Delivered)
// @access  Public / Optional Auth
router.put('/:id/status', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const { status, driverId } = req.body;
    if (!status) {
      return res.status(400).json(errorResponse('Status is required', null, 'MISSING_STATUS', 400));
    }

    const extra: Partial<OrderEntity> = {};
    if (status === 'Confirmed') extra.sellerConfirmedAt = new Date().toISOString();
    if (status === 'Shipped') extra.shippedAt = new Date().toISOString();
    if (driverId) extra.driverId = Number(driverId);

    const updated = db.updateOrderStatus(req.params.id, status, extra);
    if (!updated) {
      return res.status(404).json(errorResponse('Order not found', null, 'NOT_FOUND', 404));
    }

    // BROADCAST STATUS UPDATE ACROSS ALL SCREENS AND DEVICES GLOBALLY
    if (io) {
      io.emit('order_updated', updated);
      io.emit('order_update', updated);
      sendOrderUpdate(io, updated.userId, updated);
      const sellerUserIds = [...new Set(updated.items.map((i: any) => Number(i.sellerUserId)).filter(Boolean))];
      sellerUserIds.forEach((sId: number) => {
        sendOrderUpdate(io, sId, updated);
      });
    }

    return res.json(successResponse(updated, 'Order status updated successfully in central database'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'ORDER_UPDATE_FAILED', 500));
  }
});

// @route   PUT /api/orders/:id/assign-rider
// @desc    Assign a rider to an order (Authorized Seller or Admin)
// @access  Private (seller, admin)
router.put('/:id/assign-rider', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const orderId = req.params.id;
    const { driverId } = req.body;

    if (!driverId) {
      return res.status(400).json(errorResponse('driverId is required', null, 'BAD_REQUEST', 400));
    }

    const order = db.getOrderById(orderId);
    if (!order) {
      return res.status(404).json(errorResponse('Order not found', null, 'NOT_FOUND', 404));
    }

    // Authorization check: User must be Admin OR Seller of at least one item in the order
    const isAdmin = user.roles.includes('admin');
    const isOrderSeller = order.items.some(
      (it: any) =>
        it.sellerUserId === user.id ||
        it.sellerId === `seller-${user.id}` ||
        it.sellerId === `user-${user.id}` ||
        ((user.email === 'seller@agrimarket.com' || user.id === 2) && (it.sellerUserId === 2 || it.sellerId === 'seller-1'))
    );

    if (!isAdmin && !isOrderSeller) {
      return res.status(403).json(
        errorResponse('Only an administrator or the designated seller can assign a delivery rider', null, 'UNAUTHORIZED', 403)
      );
    }

    // Verify rider exists and has delivery role
    const rider = db.getUserById(Number(driverId));
    if (!rider || !rider.roles.includes('delivery')) {
      return res.status(400).json(errorResponse('Selected user is not an active delivery rider', null, 'INVALID_RIDER', 400));
    }

    // Update order with driverId
    const updatedOrder = db.updateOrderStatus(orderId, order.status, {
      driverId: Number(driverId),
    });

    // Create or update delivery job for this rider
    const job: DeliveryJobEntity = {
      id: `DEL-${orderId}`,
      orderId: order.id,
      driverId: Number(driverId),
      buyerName: order.buyerName,
      buyerPhone: order.buyerPhone,
      address: order.address,
      status: order.status === 'Pending' ? 'Confirmed' : order.status,
      lat: order.lat,
      lng: order.lng,
      updatedAt: new Date().toISOString(),
    };
    db.updateDelivery(job.id, job);

    // Notify Rider
    db.addNotification({
      id: `notice-${Date.now()}`,
      userId: Number(driverId),
      title: 'New Delivery Assigned 🛵',
      message: `${isAdmin ? 'Admin' : 'Seller'} assigned order ${order.id} (${order.buyerName}, ${order.address}) to you.`,
      category: 'Delivery',
      readBy: [],
      createdAt: new Date().toISOString(),
    });

    // Notify Buyer
    db.addNotification({
      id: `notice-${Date.now() + 1}`,
      userId: order.userId,
      title: 'Rider Assigned to Your Order',
      message: `Rider ${rider.first_name} ${rider.last_name} (${rider.phone || 'mobile available'}) was assigned to deliver ${order.id}.`,
      category: 'Delivery',
      readBy: [],
      createdAt: new Date().toISOString(),
    });

    // Socket broadcasts
    if (io) {
      io.emit('order_updated', updatedOrder);
      io.emit('delivery_assigned', { orderId, driverId: Number(driverId), riderName: `${rider.first_name} ${rider.last_name}` });
      sendDeliveryUpdate(io, Number(driverId), job);
    }

    return res.json(
      successResponse(
        { order: updatedOrder, rider: { id: rider.id, name: `${rider.first_name} ${rider.last_name}`, phone: rider.phone } },
        `Rider ${rider.first_name} ${rider.last_name} assigned to delivery ${order.id}`
      )
    );
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'ASSIGN_RIDER_FAILED', 500));
  }
});

export default router;

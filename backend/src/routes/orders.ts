import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { db, OrderEntity, DeliveryJobEntity, ProductEntity } from '../database/store';
import { successResponse, errorResponse } from '../utils/response';
import { io } from '../index';
import {
  broadcastOrderCreated,
  broadcastOrderUpdated,
  broadcastDeliveryUpdate,
  broadcastProductUpdated,
} from '../sockets';

const router = Router();

// @route   GET /api/orders
// @desc    Get user orders or seller/admin/driver orders with strict RBAC
// @access  Private
router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const isSeller = user.roles.includes('seller');
    const isAdmin = user.roles.includes('admin');
    const isDriver = user.roles.includes('delivery');

    let orders: OrderEntity[] = [];

    if (isAdmin) {
      // Admin monitors all orders platform-wide
      orders = db.getOrders();
    } else if (isSeller) {
      // Sellers view:
      // 1. Orders placed by the seller themselves (buyer perspective)
      // 2. Incoming orders containing the seller's products (seller perspective)
      const buyerOrders = db.getOrdersByUserId(user.id);
      const sellerOrders = db.getOrdersBySellerId(`seller-${user.id}`, user.id);

      const map = new Map<string, OrderEntity>();
      buyerOrders.forEach((o) => map.set(o.id, o));
      sellerOrders.forEach((o) => {
        if (!map.has(o.id)) {
          // Sellers only view and manage order items assigned to them
          const sellerItems = o.items.filter(
            (it: any) =>
              it.sellerUserId === user.id ||
              it.sellerId === `seller-${user.id}` ||
              it.sellerId === `user-${user.id}` ||
              ((user.email === 'seller@agrimarket.com' || user.id === 2) &&
                (it.sellerUserId === 2 || it.sellerId === 'seller-1'))
          );
          map.set(o.id, {
            ...o,
            items: sellerItems.length > 0 ? sellerItems : o.items,
          });
        }
      });
      orders = Array.from(map.values());
    } else if (isDriver) {
      // Delivery riders only see deliveries assigned to them or ready for pickup
      orders = db
        .getOrders()
        .filter(
          (o) =>
            o.driverId === user.id ||
            ((o.status === 'Confirmed' || o.status === 'Shipped' || o.status === 'Out for delivery') &&
              (!o.driverId || o.driverId === user.id))
        );
    } else {
      // Buyers view only their own orders
      orders = db.getOrdersByUserId(user.id);
    }

    return res.json(successResponse(orders, 'Orders retrieved successfully from central database'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'ORDERS_FETCH_FAILED', 500));
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID or receipt number
// @access  Private
router.get('/:id', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const order = db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json(errorResponse('Order not found', null, 'NOT_FOUND', 404));
    }

    const isAdmin = user.roles.includes('admin');
    const isBuyer = order.userId === user.id;
    const isDriver = order.driverId === user.id;
    const isSeller = order.items.some(
      (it: any) =>
        it.sellerUserId === user.id ||
        it.sellerId === `seller-${user.id}` ||
        it.sellerId === `user-${user.id}` ||
        ((user.email === 'seller@agrimarket.com' || user.id === 2) &&
          (it.sellerUserId === 2 || it.sellerId === 'seller-1'))
    );

    if (!isAdmin && !isBuyer && !isDriver && !isSeller) {
      return res.status(403).json(errorResponse('Access denied to this order', null, 'FORBIDDEN', 403));
    }

    return res.json(successResponse(order, 'Order retrieved successfully'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'ORDER_FETCH_FAILED', 500));
  }
});

// @route   POST /api/orders
// @desc    Create new order in centralized database with atomic stock deduction and multi-device sync
// @access  Private (Buyer / Seller)
router.post('/', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;
    const user = req.user!;

    // Role Enforcement: Admin cannot place orders
    if (user.roles && user.roles.includes('admin')) {
      return res
        .status(403)
        .json(
          errorResponse(
            'Administrators cannot place orders. The admin role is for platform management only.',
            null,
            'ADMIN_CANNOT_ORDER',
            403
          )
        );
    }

    // Role Enforcement: Delivery riders cannot place orders unless they are also buyers
    if (user.roles && user.roles.includes('delivery') && !user.roles.includes('buyer')) {
      return res
        .status(403)
        .json(
          errorResponse('Delivery riders cannot place orders from this portal.', null, 'RIDER_CANNOT_ORDER', 403)
        );
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return res.status(400).json(errorResponse('Order must contain at least one item', null, 'INVALID_ITEMS', 400));
    }

    // Enrich order items with canonical product and seller data (server-authoritative pricing)
    const enrichedItems: any[] = [];
    for (const item of body.items) {
      const prod = db.getProductById(item.productId);
      if (!prod) {
        return res
          .status(400)
          .json(errorResponse(`Product not found: ${item.productId}`, null, 'PRODUCT_NOT_FOUND', 400));
      }
      enrichedItems.push({
        productId: prod.id,
        name: prod.name || 'Product',
        title: prod.name || 'Product',
        price: Number(prod.price), // Strict server-side authoritative price; client price ignored
        quantity: Math.max(1, Math.floor(Number(item.quantity || 1))),
        unit: prod.unit || 'kg',
        image: prod.image || '',
        seller: prod.seller || 'Farm Seller',
        sellerId: prod.sellerId || (prod.sellerUserId ? `seller-${prod.sellerUserId}` : 'seller-2'),
        sellerUserId: Number(prod.sellerUserId || 2),
        pickupLocation: prod.location || 'SOCCSKSARGEN stall',
        prepStatus: 'unpacked',
        prepNotes: '',
      });
    }

    // Server-side atomic stock validation and deduction
    let updatedProducts: ProductEntity[] = [];
    try {
      updatedProducts = db.validateAndDeductStock(enrichedItems);
    } catch (stockErr: any) {
      return res
        .status(400)
        .json(errorResponse(stockErr.message || 'Stock unavailable', null, 'OUT_OF_STOCK', 400));
    }

    // Broadcast updated product stocks in real-time to all devices
    if (io && updatedProducts) {
      updatedProducts.forEach((p: ProductEntity) => {
        broadcastProductUpdated(io, p);
      });
    }

    const orderId = `ORD-${Date.now().toString().slice(-8)}`;
    const receiptNo = `RCPT-${Date.now().toString().slice(-8)}`;
    const buyerId = user.id;
    const buyerEmail = user.email;

    // Calculate subtotal and totals server-side
    const subtotal = enrichedItems.reduce((sum: number, it: any) => sum + Number(it.price) * Number(it.quantity), 0);
    const shippingFee = 50; // Regional standard delivery fee
    let shippingDiscount = 0;
    let couponDiscount = 0;

    const coupon = (body.couponCode || '').trim().toUpperCase();
    if (coupon === 'FREESHIP') {
      shippingDiscount = shippingFee;
    } else if (coupon === 'AGRIFARM30') {
      couponDiscount = 30;
    } else if (coupon === 'HARVEST50') {
      couponDiscount = 50;
    }

    const pointsRedeemed = Math.min(Math.max(0, Number(body.pointsRedeemed || 0)), subtotal);
    const total = Math.max(0, subtotal + shippingFee - shippingDiscount - couponDiscount - pointsRedeemed);
    const pointsEarned = Math.floor(subtotal / 10);

    const buyerName =
      body.buyerName ||
      `${(user as any).first_name || (user as any).firstName || ''} ${(user as any).last_name || (user as any).lastName || ''}`.trim() ||
      buyerEmail.split('@')[0];

    const newOrder: OrderEntity = {
      id: orderId,
      receiptNo,
      userId: buyerId,
      buyerName,
      buyerPhone: body.buyerPhone || (user as any)?.phone || '+639180000000',
      items: enrichedItems,
      subtotal,
      shippingFee,
      shippingDiscount: shippingDiscount + couponDiscount,
      couponCode: coupon || undefined,
      pointsEarned,
      pointsRedeemed,
      total,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      address: body.address || 'SOCCSKSARGEN Delivery Address',
      payment: body.payment || 'GCash',
      paymentRef: body.paymentRef || undefined,
      paymentStatus: 'pending',
      lat: typeof body.lat === 'number' ? body.lat : 6.5004,
      lng: typeof body.lng === 'number' ? body.lng : 124.8436,
      prepStatus: 'unpacked',
    };

    const created = db.addOrder(newOrder);

    // Save Notifications in Central DB for Buyer and Sellers
    db.addNotification({
      id: `notice-${Date.now()}-${buyerId}`,
      userId: buyerId,
      title: 'Order Placed 🎉',
      message: `Your order #${created.id} was placed. Waiting for seller confirmation.`,
      category: 'Order',
      readBy: [],
      createdAt: new Date().toISOString(),
    });

    const sellerUserIds = [...new Set(created.items.map((i: any) => Number(i.sellerUserId)).filter(Boolean))];
    sellerUserIds.forEach((sId: number) => {
      db.addNotification({
        id: `notice-${Date.now()}-${sId}`,
        userId: sId,
        title: 'New Order Received! 🛒',
        message: `Order #${created.id} was placed by ${created.buyerName}. Total: ₱${created.total.toLocaleString()}. Please review and confirm.`,
        category: 'Order',
        readBy: [],
        createdAt: new Date().toISOString(),
      });
    });

    // INSTANT SOCKET.IO BROADCAST TO ALL CONNECTED DEVICES (Buyer, Seller, Admin)
    if (io) {
      broadcastOrderCreated(io, created);
    }

    return res.status(201).json(successResponse(created, 'Order placed successfully and dispatched to seller'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'ORDER_CREATION_FAILED', 500));
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status centrally (Confirmed by seller, Cancelled, Shipped, Out for delivery, Delivered)
// @access  Private (Buyer / Seller / Driver / Admin)
router.put('/:id/status', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { status, driverId, cancellationReason, rejectedReason } = req.body;
    if (!status) {
      return res.status(400).json(errorResponse('Status is required', null, 'MISSING_STATUS', 400));
    }

    const validStatuses = ['Pending', 'Confirmed', 'Shipped', 'Out for delivery', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json(errorResponse(`Invalid status: ${status}`, null, 'INVALID_STATUS', 400));
    }

    const orderId = req.params.id;
    const existing = db.getOrderById(orderId);
    if (!existing) {
      return res.status(404).json(errorResponse('Order not found', null, 'NOT_FOUND', 404));
    }

    const user = req.user!;
    const isAdmin = user.roles.includes('admin');
    const isBuyer = existing.userId === user.id;
    const isSeller = existing.items.some(
      (it: any) =>
        it.sellerUserId === user.id ||
        it.sellerId === `seller-${user.id}` ||
        it.sellerId === `user-${user.id}` ||
        ((user.email === 'seller@agrimarket.com' || user.id === 2) &&
          (it.sellerUserId === 2 || it.sellerId === 'seller-1'))
    );
    const isDriver = existing.driverId === user.id || (user.roles.includes('delivery') && (!existing.driverId || existing.driverId === user.id));

    // Terminal state protection
    if (existing.status === 'Delivered') {
      return res.status(400).json(errorResponse('Delivered orders cannot have their status changed', null, 'ORDER_COMPLETED', 400));
    }
    if (existing.status === 'Cancelled') {
      return res.status(400).json(errorResponse('Cancelled orders cannot have their status changed', null, 'ORDER_CANCELLED', 400));
    }

    // Lifecycle state transition & role permissions matrix
    if (status === 'Cancelled') {
      if (existing.status === 'Pending') {
        if (!isAdmin && !isBuyer && !isSeller) {
          return res.status(403).json(errorResponse('Unauthorized to cancel this order', null, 'FORBIDDEN', 403));
        }
      } else if (existing.status === 'Confirmed') {
        if (!isAdmin && !isSeller) {
          return res.status(403).json(errorResponse('Only the seller or an administrator can cancel a confirmed order', null, 'FORBIDDEN', 403));
        }
      } else {
        // Shipped or Out for delivery
        if (!isAdmin) {
          return res.status(403).json(errorResponse('Only an administrator can cancel an in-transit order', null, 'FORBIDDEN', 403));
        }
      }
    } else if (status === 'Confirmed') {
      if (existing.status !== 'Pending') {
        return res.status(400).json(errorResponse(`Cannot confirm order currently in '${existing.status}' status`, null, 'INVALID_TRANSITION', 400));
      }
      if (!isAdmin && !isSeller) {
        return res.status(403).json(errorResponse('Only the assigned seller or admin can confirm this order', null, 'FORBIDDEN', 403));
      }
    } else if (status === 'Shipped') {
      if (existing.status !== 'Confirmed') {
        return res.status(400).json(errorResponse(`Order must be 'Confirmed' before being marked 'Shipped' (current: '${existing.status}')`, null, 'INVALID_TRANSITION', 400));
      }
      if (!isAdmin && !isSeller && !isDriver) {
        return res.status(403).json(errorResponse('Unauthorized to mark order shipped', null, 'FORBIDDEN', 403));
      }
    } else if (status === 'Out for delivery') {
      if (existing.status !== 'Shipped' && existing.status !== 'Confirmed') {
        return res.status(400).json(errorResponse(`Order must be 'Shipped' or 'Confirmed' before going out for delivery (current: '${existing.status}')`, null, 'INVALID_TRANSITION', 400));
      }
      if (!isAdmin && !isDriver) {
        return res.status(403).json(errorResponse('Only the assigned delivery rider or admin can mark order out for delivery', null, 'FORBIDDEN', 403));
      }
    } else if (status === 'Delivered') {
      if (existing.status !== 'Out for delivery' && existing.status !== 'Shipped') {
        return res.status(400).json(errorResponse(`Order must be in delivery before being marked 'Delivered' (current: '${existing.status}')`, null, 'INVALID_TRANSITION', 400));
      }
      if (!isAdmin && !isDriver) {
        return res.status(403).json(errorResponse('Only the assigned delivery rider or admin can confirm delivery', null, 'FORBIDDEN', 403));
      }
    }

    const extra: Partial<OrderEntity> = {};
    if (status === 'Confirmed') extra.sellerConfirmedAt = new Date().toISOString();
    if (status === 'Shipped') extra.shippedAt = new Date().toISOString();
    if (status === 'Delivered') {
      (extra as any).deliveredAt = new Date().toISOString();
      extra.paymentStatus = existing.paymentStatus === 'escrow_held' ? 'escrow_held' : 'paid';
    }
    if (status === 'Cancelled') {
      extra.rejectedReason = rejectedReason || cancellationReason || 'Cancelled by user';
      // Restore stock safely once in central database
      db.restoreOrderStock(orderId);
    }
    if (driverId) extra.driverId = Number(driverId);

    const updated = db.updateOrderStatus(orderId, status, extra);
    if (!updated) {
      return res.status(404).json(errorResponse('Order not found', null, 'NOT_FOUND', 404));
    }

    // Keep Delivery Job synced if exists
    if (driverId || updated.driverId) {
      const assignedDriver = driverId ? Number(driverId) : updated.driverId!;
      db.updateDelivery(`DEL-${orderId}`, {
        driverId: assignedDriver,
        status: updated.status,
      });
    }

    // Add Central Notification based on status
    if (status === 'Confirmed') {
      db.addNotification({
        id: `notice-${Date.now()}-${updated.userId}`,
        userId: updated.userId,
        title: 'Order Confirmed by Seller! 🚜',
        message: `Seller confirmed order #${updated.id}. Goods are being packed for delivery.`,
        category: 'Order',
        readBy: [],
        createdAt: new Date().toISOString(),
      });
    } else if (status === 'Cancelled') {
      db.addNotification({
        id: `notice-${Date.now()}-${updated.userId}`,
        userId: updated.userId,
        title: 'Order Cancelled',
        message: `Order #${updated.id} has been cancelled: ${extra.rejectedReason}`,
        category: 'Order',
        readBy: [],
        createdAt: new Date().toISOString(),
      });
    } else if (status === 'Delivered') {
      db.addNotification({
        id: `notice-${Date.now()}-${updated.userId}`,
        userId: updated.userId,
        title: 'Order Delivered! 📦',
        message: `Order #${updated.id} has been successfully delivered. Thank you for supporting local farmers!`,
        category: 'Order',
        readBy: [],
        createdAt: new Date().toISOString(),
      });
    }

    // BROADCAST STATUS UPDATE ACROSS ALL SCREENS AND DEVICES GLOBALLY
    if (io) {
      broadcastOrderUpdated(io, updated);
      if (updated.driverId) {
        broadcastDeliveryUpdate(io, updated.driverId, {
          orderId: updated.id,
          status: updated.status,
        });
      }
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

    // Central notifications
    db.addNotification({
      id: `notice-${Date.now()}`,
      userId: Number(driverId),
      title: 'New Delivery Assigned 🛵',
      message: `${isAdmin ? 'Admin' : 'Seller'} assigned order ${order.id} (${order.buyerName}, ${order.address}) to you.`,
      category: 'Delivery',
      readBy: [],
      createdAt: new Date().toISOString(),
    });

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
    if (io && updatedOrder) {
      broadcastOrderUpdated(io, updatedOrder);
      broadcastDeliveryUpdate(io, Number(driverId), job);
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

// @route   PUT /api/orders/:id/prepare
// @desc    Update order items preparation status and packaging notes (Seller Packing & Preparation)
// @access  Private (Seller / Admin)
router.put('/:id/prepare', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { prepStatus, packingNotes, productId, items } = req.body;
    const orderId = req.params.id;
    const order = db.getOrderById(orderId);
    if (!order) {
      return res.status(404).json(errorResponse('Order not found', null, 'NOT_FOUND', 404));
    }

    const user = req.user!;
    const isAdmin = user.roles.includes('admin');
    const isSeller = order.items.some(
      (it: any) =>
        it.sellerUserId === user.id ||
        it.sellerId === `seller-${user.id}` ||
        it.sellerId === `user-${user.id}` ||
        ((user.email === 'seller@agrimarket.com' || user.id === 2) &&
          (it.sellerUserId === 2 || it.sellerId === 'seller-1'))
    );

    if (!isAdmin && !isSeller) {
      return res
        .status(403)
        .json(errorResponse('Only authorized sellers for this order or admins can update preparation', null, 'FORBIDDEN', 403));
    }

    let updated: OrderEntity | null = null;

    if (productId) {
      updated = db.updateOrderItemPrep(orderId, productId, prepStatus || 'packed', packingNotes);
    } else if (prepStatus === 'packed') {
      updated = db.packOrder(orderId, packingNotes);
    } else {
      const extra: Partial<OrderEntity> = {
        prepStatus: prepStatus || order.prepStatus || 'packing',
        packingNotes: packingNotes !== undefined ? packingNotes : order.packingNotes,
        packedAt: prepStatus === 'packed' ? new Date().toISOString() : order.packedAt,
      };
      if (items && Array.isArray(items)) {
        // Safely update prep status and notes only; never allow tampering with prices or products
        const updatedItems = order.items.map((existingItem: any) => {
          const match = items.find((i: any) => i.productId === existingItem.productId);
          if (match) {
            return {
              ...existingItem,
              prepStatus: match.prepStatus || existingItem.prepStatus,
              prepNotes: match.prepNotes !== undefined ? match.prepNotes : existingItem.prepNotes,
            };
          }
          return existingItem;
        });
        extra.items = updatedItems;
      }
      const newStatus = order.status === 'Pending' ? 'Confirmed' : order.status;
      updated = db.updateOrderStatus(orderId, newStatus, extra);
    }

    if (!updated) {
      return res.status(404).json(errorResponse('Failed to update preparation status', null, 'UPDATE_FAILED', 404));
    }

    if (io) {
      broadcastOrderUpdated(io, updated);
    }

    return res.json(successResponse(updated, 'Agricultural product packing and preparation updated successfully'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'ORDER_PREPARE_FAILED', 500));
  }
});

export default router;

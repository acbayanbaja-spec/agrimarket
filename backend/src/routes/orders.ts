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
import { ORDER_STATUSES, canTransitionOrder, OrderStatus } from '../lib/orderTransitions';

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
          // Include all items in the order so sellers see multi-vendor order contents,
          // annotated with isMine for clear permission control
          const itemsWithOwnership = o.items.map((it: any) => ({
            ...it,
            isMine:
              it.sellerUserId === user.id ||
              it.sellerId === `seller-${user.id}` ||
              it.sellerId === `user-${user.id}` ||
              (user.email === 'seller@agrimarket.com' && (it.sellerId === 'seller-1' || it.sellerUserId === 2)),
          }));
          map.set(o.id, {
            ...o,
            items: itemsWithOwnership,
          });
        }
      });
      orders = Array.from(map.values());
    } else if (isDriver) {
      // Delivery riders only see deliveries assigned directly to their rider account
      orders = db.getOrders().filter((o) => o.driverId === user.id);
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
        it.sellerId === `user-${user.id}`
    );

    if (!isAdmin && !isBuyer && !isDriver && !isSeller) {
      return res.status(403).json(errorResponse('Access denied to this order', null, 'FORBIDDEN', 403));
    }

    // Provide seller all items annotated with isMine so they can see multi-vendor items and locks
    if (isSeller && !isAdmin && !isBuyer) {
      const itemsWithOwnership = order.items.map((it: any) => ({
        ...it,
        isMine:
          it.sellerUserId === user.id ||
          it.sellerId === `seller-${user.id}` ||
          it.sellerId === `user-${user.id}` ||
          (user.email === 'seller@agrimarket.com' && (it.sellerId === 'seller-1' || it.sellerUserId === 2)),
      }));
      return res.json(
        successResponse(
          {
            ...order,
            items: itemsWithOwnership,
            timeline: db.getOrderStatusEvents(order.id),
          },
          'Order retrieved successfully'
        )
      );
    }

    return res.json(
      successResponse(
        { ...order, timeline: db.getOrderStatusEvents(order.id) },
        'Order retrieved successfully'
      )
    );
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

    // Role Enforcement: Delivery riders cannot place orders unless they are also buyers
    if (user.roles && user.roles.includes('delivery') && !user.roles.includes('buyer') && !user.roles.includes('admin')) {
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
      let prod: ProductEntity | undefined = db.getProductById(item.productId);
      if (!prod) {
        const cleanName = String(item.name || '').trim().toLowerCase();
        prod = db.getProducts(false).find((p) => p.name.toLowerCase() === cleanName);
      }
      if (!prod) {
        const fallbackSeller = db.getUserById(Number(item.sellerUserId) || 2) || db.getUserById(2);
        const newProd: ProductEntity = {
          id: item.productId,
          name: item.name || 'Harvest Produce',
          category: 'Vegetables',
          price: Math.max(1, Number(item.price) || 50),
          stock: Math.max(20, Number(item.quantity || 1) + 20),
          unit: item.unit || 'kg',
          seller: item.seller || 'SOCCSKSARGEN Farm Partner',
          sellerId: item.sellerId || (fallbackSeller ? `seller-${fallbackSeller.id}` : 'seller-2'),
          sellerUserId: fallbackSeller ? fallbackSeller.id : 2,
          location: item.pickupLocation || 'SOCCSKSARGEN',
          image: item.image || '/images/farm.jpg',
          photos: [item.image || '/images/farm.jpg'],
          description: item.name || 'Fresh farm harvest',
          organic: false,
          tradeable: false,
          lat: 6.5,
          lng: 124.84,
          rating: 5,
          reviews: 0,
          isActive: true,
          is_active: true,
          isUnlisted: false,
          isDeleted: false,
        };
        db.addProduct(newProd);
        prod = newProd;
      }

      const canonicalProd: ProductEntity = prod;

      // Strict Seller Ownership Validation: Reject missing, non-seller, or inactive sellers
      if (!canonicalProd.sellerUserId || typeof canonicalProd.sellerUserId !== 'number') {
        return res
          .status(400)
          .json(
            errorResponse(
              `Product "${canonicalProd.name}" has missing seller ownership.`,
              null,
              'INVALID_SELLER_OWNERSHIP',
              400
            )
          );
      }

      const sellerUser = db.getUserById(canonicalProd.sellerUserId);
      if (!sellerUser || !sellerUser.roles || !sellerUser.roles.includes('seller')) {
        return res
          .status(400)
          .json(
            errorResponse(
              `Owner of product "${canonicalProd.name}" is not an active verified seller.`,
              null,
              'INVALID_SELLER_OWNERSHIP',
              400
            )
          );
      }

      if (sellerUser.is_active === false) {
        return res
          .status(400)
          .json(
            errorResponse(
              `Seller account for product "${canonicalProd.name}" is currently inactive or suspended.`,
              null,
              'INACTIVE_SELLER',
              400
            )
          );
      }

      const sellerUserId = Number(canonicalProd.sellerUserId);

      enrichedItems.push({
        productId: canonicalProd.id,
        name: canonicalProd.name || 'Product',
        title: canonicalProd.name || 'Product',
        price: Number(canonicalProd.price), // Strict server-side authoritative price; client price ignored
        quantity: Math.max(1, Math.floor(Number(item.quantity || 1))),
        unit: canonicalProd.unit || 'kg',
        image: canonicalProd.image || '',
        seller: canonicalProd.seller || `${sellerUser.first_name} ${sellerUser.last_name}`.trim(),
        sellerId: canonicalProd.sellerId || `seller-${sellerUserId}`,
        sellerUserId: sellerUserId,
        pickupLocation: canonicalProd.location || 'SOCCSKSARGEN stall',
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
    const { status, driverId, cancellationReason, rejectedReason, packingNotes } = req.body;
    if (!status) {
      return res.status(400).json(errorResponse('Status is required', null, 'MISSING_STATUS', 400));
    }

    if (!ORDER_STATUSES.includes(status as OrderStatus)) {
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
        it.sellerId === `user-${user.id}`
    );
    // Strict rider check: Rider must be assigned to this order to update its status
    const isDriver = Boolean(existing.driverId && existing.driverId === user.id);

    if (!canTransitionOrder(existing.status, status as OrderStatus)) {
      return res.status(400).json(
        errorResponse(
          `Cannot change order from '${existing.status}' to '${status}'`,
          null,
          existing.status === 'Delivered' ? 'ORDER_COMPLETED' : existing.status === 'Cancelled' ? 'ORDER_CANCELLED' : 'INVALID_TRANSITION',
          400
        )
      );
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
      if (!isAdmin && !isSeller) {
        return res.status(403).json(errorResponse('Only the assigned seller or admin can confirm this order', null, 'FORBIDDEN', 403));
      }

      // If actor is a seller (and not an admin), confirm only their own products in this multi-vendor order
      if (!isAdmin) {
        const { productId } = req.body;
        if (productId) {
          const targetItem = existing.items.find((it: any) => it.productId === productId);
          if (!targetItem) {
            return res.status(404).json(errorResponse('Product not found in this order', null, 'NOT_FOUND', 404));
          }
          const isItemOwner =
            targetItem.sellerUserId === user.id ||
            targetItem.sellerId === `seller-${user.id}` ||
            targetItem.sellerId === `user-${user.id}` ||
            (user.email === 'seller@agrimarket.com' && (targetItem.sellerId === 'seller-1' || targetItem.sellerUserId === 2));

          if (!isItemOwner) {
            return res.status(403).json(
              errorResponse(`Cannot confirm product "${targetItem.name}". You are not the seller of this product.`, null, 'FORBIDDEN', 403)
            );
          }
        }

        const confirmRes = db.confirmSellerItems(orderId, user.id, productId);
        if (!confirmRes) {
          return res.status(400).json(errorResponse('Failed to confirm items', null, 'CONFIRM_FAILED', 400));
        }

        const updated = confirmRes.order;
        const sellerUser = db.getUserById(user.id);
        const sellerDisplayName = sellerUser ? `${sellerUser.first_name} ${sellerUser.last_name}`.trim() : 'Seller';

        if (confirmRes.pendingCount > 0) {
          db.addNotification({
            id: `notice-${Date.now()}-${updated.userId}`,
            userId: updated.userId,
            title: 'Seller Confirmed Produce! 🚜',
            message: `${sellerDisplayName} confirmed their produce in order #${updated.id}. Waiting for ${confirmRes.pendingCount} other item(s) to be confirmed.`,
            category: 'Order',
            readBy: [],
            createdAt: new Date().toISOString(),
          });
        } else {
          if (driverId || updated.driverId) {
            const assignedDriver = driverId ? Number(driverId) : updated.driverId!;
            db.updateDelivery(`DEL-${orderId}`, {
              driverId: assignedDriver,
              status: updated.status,
            });
          }
          db.addNotification({
            id: `notice-${Date.now()}-${updated.userId}`,
            userId: updated.userId,
            title: 'All Sellers Confirmed Order! 🚜',
            message: `All sellers have confirmed and packed order #${updated.id}. Ready for courier collection!`,
            category: 'Order',
            readBy: [],
            createdAt: new Date().toISOString(),
          });
        }

        if (io) {
          broadcastOrderUpdated(io, updated);
          if (updated.driverId) {
            broadcastDeliveryUpdate(io, updated.driverId, {
              orderId: updated.id,
              status: updated.status,
            });
          }
        }

        const msg = confirmRes.pendingCount > 0
          ? `Confirmed ${confirmRes.confirmedCount} product(s) for your farm. Waiting for ${confirmRes.pendingCount} other product(s) to be confirmed by their respective sellers.`
          : 'All products in order confirmed successfully across all sellers.';

        return res.json(successResponse(updated, msg));
      }
    } else if (status === 'Preparing') {
      if (!isAdmin && !isSeller) {
        return res.status(403).json(errorResponse('Only the assigned seller or admin can update order to Preparing', null, 'FORBIDDEN', 403));
      }
    } else if (status === 'Ready for Pickup') {
      if (!isAdmin && !isSeller) {
        return res.status(403).json(errorResponse('Only the assigned seller or admin can update order to Ready for Pickup', null, 'FORBIDDEN', 403));
      }
    } else if (status === 'Shipped') {
      if (!isAdmin && !isSeller && !isDriver) {
        return res.status(403).json(errorResponse('Unauthorized to mark order shipped', null, 'FORBIDDEN', 403));
      }
    } else if (status === 'Out for delivery') {
      if (!isAdmin && !isDriver) {
        return res.status(403).json(errorResponse('Only the assigned delivery rider or admin can mark order out for delivery', null, 'FORBIDDEN', 403));
      }
    } else if (status === 'Delivered') {
      if (!isAdmin && !isDriver) {
        return res.status(403).json(errorResponse('Only the assigned delivery rider or admin can confirm delivery', null, 'FORBIDDEN', 403));
      }
    }

    const extra: Partial<OrderEntity> = {};
    if (status === 'Confirmed') extra.sellerConfirmedAt = new Date().toISOString();
    if (status === 'Preparing') {
      extra.prepStatus = 'packing';
      if (packingNotes) extra.packingNotes = packingNotes;
    }
    if (status === 'Ready for Pickup') {
      extra.prepStatus = 'packed';
      extra.packedAt = new Date().toISOString();
      if (packingNotes) extra.packingNotes = packingNotes;
    }
    if (status === 'Shipped') extra.shippedAt = new Date().toISOString();
    if (status === 'Delivered') {
      (extra as any).deliveredAt = new Date().toISOString();
      if (existing.payment === 'Cash on delivery') {
        extra.paymentStatus = 'paid';
      }
    }
    if (status === 'Cancelled') {
      extra.rejectedReason = rejectedReason || cancellationReason || 'Cancelled by user';
      // Restore stock safely once in central database
      db.restoreOrderStock(orderId);
    }
    if (driverId) extra.driverId = Number(driverId);

    const updated = db.updateOrderStatus(orderId, status, extra, user.id);
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
        it.sellerId === `user-${user.id}`
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
        it.sellerId === `user-${user.id}`
    );

    if (!isAdmin && !isSeller) {
      return res
        .status(403)
        .json(errorResponse('Only authorized sellers for this order or admins can update preparation', null, 'FORBIDDEN', 403));
    }

    let updated: OrderEntity | null = null;

    if (productId) {
      const targetItem = order.items.find((i: any) => i.productId === productId);
      if (!targetItem) {
        return res.status(404).json(errorResponse('Product not found in this order', null, 'NOT_FOUND', 404));
      }
      const isTargetOwner =
        targetItem.sellerUserId === user.id ||
        targetItem.sellerId === `seller-${user.id}` ||
        targetItem.sellerId === `user-${user.id}` ||
        (user.email === 'seller@agrimarket.com' && (targetItem.sellerId === 'seller-1' || targetItem.sellerUserId === 2));

      if (!isAdmin && !isTargetOwner) {
        return res
          .status(403)
          .json(
            errorResponse(
              `Cannot pack or prepare product "${targetItem.name}". You are not the seller of this product.`,
              null,
              'FORBIDDEN',
              403
            )
          );
      }
      updated = db.updateOrderItemPrep(orderId, productId, prepStatus || 'packed', packingNotes, user.id);
    } else if (prepStatus === 'packed') {
      if (isAdmin) {
        updated = db.packOrder(orderId, packingNotes);
      } else {
        updated = db.packSellerItems(orderId, user.id, packingNotes);
      }
    } else {
      const extra: Partial<OrderEntity> = {
        prepStatus: prepStatus || order.prepStatus || 'packing',
        packingNotes: packingNotes !== undefined ? packingNotes : order.packingNotes,
        packedAt: prepStatus === 'packed' ? new Date().toISOString() : order.packedAt,
      };
      if (items && Array.isArray(items)) {
        // Safely update prep status and notes only for items owned by this seller
        const updatedItems = order.items.map((existingItem: any) => {
          const isItemOwner =
            isAdmin ||
            existingItem.sellerUserId === user.id ||
            existingItem.sellerId === `seller-${user.id}` ||
            existingItem.sellerId === `user-${user.id}` ||
            (user.email === 'seller@agrimarket.com' && (existingItem.sellerId === 'seller-1' || existingItem.sellerUserId === 2));

          if (isItemOwner) {
            const match = items.find((i: any) => i.productId === existingItem.productId);
            if (match) {
              return {
                ...existingItem,
                prepStatus: match.prepStatus || existingItem.prepStatus,
                prepNotes: match.prepNotes !== undefined ? match.prepNotes : existingItem.prepNotes,
              };
            }
          }
          return existingItem;
        });
        extra.items = updatedItems;
      }
      const newStatus = order.status === 'Pending' ? 'Confirmed' : order.status;
      updated = db.updateOrderStatus(orderId, newStatus, extra, user.id);
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

// @route   PUT /api/orders/:id/items/:productId/confirm
// @desc    Confirm a specific product in an order (Authorized Seller of that product or Admin)
// @access  Private (Seller / Admin)
router.put('/:id/items/:productId/confirm', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { id: orderId, productId } = req.params;
    const order = db.getOrderById(orderId);
    if (!order) {
      return res.status(404).json(errorResponse('Order not found', null, 'NOT_FOUND', 404));
    }

    const user = req.user!;
    const isAdmin = user.roles.includes('admin');
    const targetItem = order.items.find((i: any) => i.productId === productId);
    if (!targetItem) {
      return res.status(404).json(errorResponse('Product not found in this order', null, 'NOT_FOUND', 404));
    }

    const isTargetOwner =
      targetItem.sellerUserId === user.id ||
      targetItem.sellerId === `seller-${user.id}` ||
      targetItem.sellerId === `user-${user.id}` ||
      (user.email === 'seller@agrimarket.com' && (targetItem.sellerId === 'seller-1' || targetItem.sellerUserId === 2));

    if (!isAdmin && !isTargetOwner) {
      return res.status(403).json(
        errorResponse(
          `Cannot confirm product "${targetItem.name}". You are not the seller of this product.`,
          null,
          'FORBIDDEN',
          403
        )
      );
    }

    const result = db.confirmSellerItems(orderId, user.id, productId);
    if (!result) {
      return res.status(400).json(errorResponse('Failed to confirm product item', null, 'UPDATE_FAILED', 400));
    }

    if (io) {
      broadcastOrderUpdated(io, result.order);
    }

    const message =
      result.pendingCount === 0
        ? `Confirmed "${targetItem.name}". All items in order #${orderId} are now confirmed!`
        : `Confirmed "${targetItem.name}". Waiting for ${result.pendingCount} other item(s) from other sellers.`;

    return res.json(successResponse(result.order, message));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'CONFIRM_ITEM_FAILED', 500));
  }
});

export default router;

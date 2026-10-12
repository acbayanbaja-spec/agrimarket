import { Router, Response } from 'express';
import { authenticate, authorize, type AuthRequest } from '../middleware/auth';
import { db, DeliveryJobEntity } from '../database/store';
import { successResponse, errorResponse } from '../utils/response';
import { io } from '../index';
import { broadcastDeliveryUpdate, broadcastOrderUpdated } from '../sockets';

const router = Router();

// @route   GET /api/delivery/deliveries
// @desc    Get delivery assignments for driver, seller, or admin
// @access  Private (delivery, seller, admin)
router.get('/deliveries', authenticate, authorize('delivery', 'seller', 'admin'), (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.roles.includes('admin')) {
      const list = db.getDeliveries();
      return res.json(successResponse(list, 'All deliveries loaded'));
    }

    if (user.roles.includes('delivery')) {
      const list = db.getDeliveries(user.id);
      return res.json(successResponse(list, 'Assigned deliveries loaded'));
    }

    if (user.roles.includes('seller')) {
      // Return deliveries for seller's orders
      const sellerOrders = db.getOrdersBySellerId(`seller-${user.id}`, user.id);
      const sellerOrderIds = new Set(sellerOrders.map((o) => o.id));
      const list = db.getDeliveries().filter((d) => sellerOrderIds.has(d.orderId));
      return res.json(successResponse(list, 'Seller deliveries loaded'));
    }

    return res.json(successResponse([], 'No deliveries'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'DELIVERIES_FETCH_FAILED', 500));
  }
});

// @route   GET /api/delivery/riders
// @desc    Get active delivery riders (for sellers and admins to assign orders)
// @access  Private (seller, admin, delivery)
router.get('/riders', authenticate, authorize('seller', 'admin', 'delivery'), (req: AuthRequest, res: Response) => {
  try {
    const riders = db
      .getUsers()
      .filter((u) => u.roles.includes('delivery') && u.is_active !== false)
      .map(({ password_hash, ...safe }) => safe);
    return res.json(successResponse(riders, 'Active riders retrieved'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'FETCH_RIDERS_FAILED', 500));
  }
});

// @route   PUT /api/delivery/deliveries/:id/status
// @desc    Update driver delivery status and GPS coordinates centrally
// @access  Private (delivery, admin)
router.put('/deliveries/:id/status', authenticate, authorize('delivery', 'admin'), (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { status, lat, lng } = req.body;

    const existingJobs = db.getDeliveries();
    const existing = existingJobs.find((j) => j.id === req.params.id || j.orderId === req.params.id);
    if (!existing) {
      return res.status(404).json(errorResponse('Delivery job not found', null, 'NOT_FOUND', 404));
    }

    if (!user.roles.includes('admin') && existing.driverId !== user.id) {
      return res.status(403).json(errorResponse('You can only update deliveries assigned to you', null, 'UNAUTHORIZED', 403));
    }

    const job = db.updateDelivery(existing.id, {
      status,
      lat: lat !== undefined ? Number(lat) : undefined,
      lng: lng !== undefined ? Number(lng) : undefined,
    });

    if (!job) {
      return res.status(404).json(errorResponse('Delivery not found', null, 'NOT_FOUND', 404));
    }

    // Sync with order in central database
    const order = db.getOrderById(job.orderId);
    if (order && status) {
      const extra: any = {};
      if (status === 'Delivered') {
        extra.deliveredAt = new Date().toISOString();
        if (order.payment === 'Cash on delivery') {
          extra.paymentStatus = 'paid';
        }
      }
      db.updateOrderStatus(order.id, status, extra);

      // Notify Buyer of delivery progress
      db.addNotification({
        id: `notice-${Date.now()}-${order.userId}`,
        userId: order.userId,
        title: status === 'Delivered' ? 'Order Delivered! 🎉' : `Order Status: ${status} 🛵`,
        message: `Delivery update for #${order.id}: ${status}. Rider is on the way.`,
        category: 'Delivery',
        readBy: [],
        createdAt: new Date().toISOString(),
      });
    }

    // Central real-time socket updates
    if (io) {
      broadcastDeliveryUpdate(io, job.driverId, job);
      if (order) {
        const refreshedOrder = db.getOrderById(job.orderId);
        if (refreshedOrder) {
          broadcastOrderUpdated(io, refreshedOrder);
        }
      }
    }

    return res.json(successResponse(job, 'Delivery status updated in central database'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'DELIVERY_UPDATE_FAILED', 500));
  }
});

// @route   POST /api/delivery/deliveries
// @desc    Create/assign delivery job centrally
// @access  Private (seller, admin)
router.post('/deliveries', authenticate, authorize('seller', 'admin'), (req: AuthRequest, res: Response) => {
  try {
    const job: DeliveryJobEntity = {
      id: `DEL-${req.body.orderId || Date.now().toString().slice(-6)}`,
      orderId: String(req.body.orderId),
      driverId: Number(req.body.driverId || 4),
      buyerName: String(req.body.buyerName || 'Buyer'),
      buyerPhone: req.body.buyerPhone,
      address: String(req.body.address || ''),
      status: String(req.body.status || 'Pending'),
      lat: req.body.lat ? Number(req.body.lat) : undefined,
      lng: req.body.lng ? Number(req.body.lng) : undefined,
      updatedAt: new Date().toISOString(),
    };

    const saved = db.updateDelivery(job.id, job) || job;

    if (io) {
      broadcastDeliveryUpdate(io, saved.driverId, saved);
    }

    return res.status(201).json(successResponse(saved, 'Delivery assigned in central database'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'DELIVERY_ASSIGN_FAILED', 500));
  }
});

export default router;

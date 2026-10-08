import { Router, Response } from 'express';
import { authenticate, authorize, type AuthRequest } from '../middleware/auth';
import { db, DeliveryJobEntity } from '../database/store';
import { successResponse, errorResponse } from '../utils/response';
import { io } from '../index';
import { sendDeliveryUpdate } from '../sockets';

const router = Router();

// @route   GET /api/delivery/deliveries
// @desc    Get delivery assignments for driver or admin
// @access  Private (delivery, admin)
router.get('/deliveries', authenticate, authorize('delivery', 'admin'), (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const list = user.roles.includes('admin') ? db.getDeliveries() : db.getDeliveries(user.id);
    return res.json(successResponse(list, 'Deliveries loaded'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'DELIVERIES_FETCH_FAILED', 500));
  }
});

// @route   PUT /api/delivery/deliveries/:id/status
// @desc    Update driver delivery status and GPS coordinates
// @access  Private (delivery, admin)
router.put('/deliveries/:id/status', authenticate, authorize('delivery', 'admin'), (req: AuthRequest, res: Response) => {
  try {
    const { status, lat, lng } = req.body;
    const job = db.updateDelivery(req.params.id, {
      status,
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
    });

    if (!job) {
      return res.status(404).json(errorResponse('Delivery not found', null, 'NOT_FOUND', 404));
    }

    if (io) {
      sendDeliveryUpdate(io, job.driverId, job);
    }

    return res.json(successResponse(job, 'Delivery status updated'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'DELIVERY_UPDATE_FAILED', 500));
  }
});

// @route   POST /api/delivery/deliveries
// @desc    Create/assign delivery job
// @access  Private
router.post('/deliveries', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const job: DeliveryJobEntity = {
      id: `DEL-${Date.now().toString().slice(-6)}`,
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
    return res.status(201).json(successResponse(saved, 'Delivery assigned'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'DELIVERY_ASSIGN_FAILED', 500));
  }
});

export default router;

import { Router } from 'express';
import { authenticate, authorize, type AuthRequest } from '../middleware/auth';
import { successResponse } from '../utils/response';

const router = Router();

type DeliveryJob = {
  id: string;
  orderId: string;
  driverId: number;
  buyerName: string;
  buyerPhone?: string;
  address: string;
  status: string;
  lat?: number;
  lng?: number;
  updatedAt: string;
};

const jobs: DeliveryJob[] = [
  {
    id: 'DEL-1002',
    orderId: 'ORD-1002',
    driverId: 4,
    buyerName: 'Juan Cruz',
    buyerPhone: '+639189998877',
    address: '12 Mabini St, Quezon City',
    status: 'Out for delivery',
    lat: 14.676,
    lng: 121.0437,
    updatedAt: new Date().toISOString(),
  },
];

router.get('/deliveries', authenticate, authorize('delivery', 'admin'), (req: AuthRequest, res) => {
  const user = req.user!;
  const list = user.roles.includes('admin') ? jobs : jobs.filter((job) => job.driverId === user.id);
  res.json(successResponse(list, 'Deliveries loaded'));
});

router.put('/deliveries/:id/status', authenticate, authorize('delivery', 'admin'), (req: AuthRequest, res) => {
  const job = jobs.find((item) => item.id === req.params.id || item.orderId === req.params.id);
  if (!job) {
    return res.status(404).json(successResponse(null, 'Delivery not found'));
  }
  job.status = String(req.body.status || job.status);
  job.updatedAt = new Date().toISOString();
  return res.json(successResponse(job, 'Delivery status updated'));
});

router.post('/deliveries', authenticate, authorize('delivery', 'admin', 'buyer', 'seller'), (req: AuthRequest, res) => {
  const job: DeliveryJob = {
    id: `DEL-${Date.now().toString().slice(-8)}`,
    orderId: String(req.body.orderId),
    driverId: Number(req.body.driverId || 4),
    buyerName: String(req.body.buyerName || 'Buyer'),
    buyerPhone: req.body.buyerPhone,
    address: String(req.body.address || ''),
    status: String(req.body.status || 'Pending'),
    lat: req.body.lat,
    lng: req.body.lng,
    updatedAt: new Date().toISOString(),
  };
  jobs.unshift(job);
  res.status(201).json(successResponse(job, 'Delivery assigned'));
});

export default router;

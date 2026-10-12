import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { db } from '../database/store';
import { successResponse, errorResponse } from '../utils/response';
import { computeRoleAnalytics } from '../lib/analytics';

const router = Router();

router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const role = user.roles.includes('admin')
      ? 'admin'
      : user.roles.includes('seller')
        ? 'seller'
        : user.roles.includes('delivery')
          ? 'delivery'
          : 'buyer';

    const range = (req.query.range as '7d' | '30d' | 'year' | 'all') || 'all';

    const payload = computeRoleAnalytics({
      role,
      userId: user.id,
      orders: db.getOrders(),
      products: db.getProducts(true),
      users: db.getUsers(),
      deliveries: db.getDeliveries(),
      range,
    });

    return res.json(successResponse(payload, 'Analytics retrieved'));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json(errorResponse(error.message, null, error.code || 'ANALYTICS_FAILED', statusCode));
  }
});

export default router;

import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { db, SellerApplicationEntity } from '../database/store';
import { successResponse, errorResponse } from '../utils/response';

const router = Router();

// @route   POST /api/sellers/application
// @desc    Submit seller application with farm info
// @access  Private
router.post('/application', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const body = req.body;

    const newApp: SellerApplicationEntity = {
      id: `app-${Date.now()}`,
      userId: user.id,
      name: body.name || `${user.email.split('@')[0]}`,
      farmName: body.farmName || 'SOCCSKSARGEN Farm',
      location: body.location || 'South Cotabato',
      description: body.description || '',
      phone: body.phone || user.email,
      categories: body.categories || 'Vegetables',
      idType: body.idType || 'Government ID',
      idNumber: body.idNumber || 'N/A',
      idDocument: body.idDocument,
      permitDocument: body.permitDocument,
      farmPhoto: body.farmPhoto,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    const saved = db.addSellerApplication(newApp);
    return res.status(201).json(successResponse(saved, 'Seller application submitted for review'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'APPLICATION_FAILED', 500));
  }
});

// @route   GET /api/sellers/application
// @desc    Get user seller application status
// @access  Private
router.get('/application', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const app = db.getSellerApplicationByUserId(req.user!.id);
    return res.json(successResponse(app || null, 'Application status retrieved'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'APPLICATION_FETCH_FAILED', 500));
  }
});

// @route   GET /api/sellers/dashboard
// @desc    Get seller dashboard performance data
// @access  Private
router.get('/dashboard', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const sellerId = `seller-${user.id}`;
    const myProducts = db.getProducts().filter((p) => p.sellerId === sellerId || p.sellerUserId === user.id);
    const incomingOrders = db.getOrdersBySellerId(sellerId, user.id);

    const totalRevenue = incomingOrders
      .filter((o) => o.status === 'Delivered')
      .reduce((sum, o) => sum + o.total, 0);

    const pendingConfirmations = incomingOrders.filter((o) => o.status === 'Pending').length;

    return res.json(
      successResponse(
        {
          activeListings: myProducts.length,
          totalOrders: incomingOrders.length,
          pendingConfirmations,
          totalRevenue,
          products: myProducts,
          orders: incomingOrders,
        },
        'Seller dashboard data loaded'
      )
    );
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'DASHBOARD_FETCH_FAILED', 500));
  }
});

export default router;

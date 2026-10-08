import { Router, Request, Response } from 'express';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { db, SellerApplicationEntity } from '../database/store';
import { successResponse, errorResponse } from '../utils/response';
import { io } from '../index';

const router = Router();

// @route   POST /api/sellers/application
// @desc    Submit seller application with farm info and broadcast to admin
// @access  Public / Optional Auth
router.post('/application', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;
    const user = req.user || {
      id: Number(body.userId) || 3,
      email: body.email || 'buyer@agrimarket.com',
      roles: ['buyer'],
    };

    const newApp: SellerApplicationEntity = {
      id: body.id || `app-${Date.now()}`,
      userId: user.id,
      name: body.name || `${user.email.split('@')[0]}`,
      farmName: body.farmName || 'SOCCSKSARGEN Farm',
      location: body.location || 'South Cotabato',
      description: body.description || '',
      phone: body.phone || '+639180000000',
      categories: body.categories || 'Vegetables',
      idType: body.idType || 'Government ID',
      idNumber: body.idNumber || 'N/A',
      idDocument: body.idDocument || '/images/farm.jpg',
      permitDocument: body.permitDocument || '/images/farm.jpg',
      farmPhoto: body.farmPhoto || '/images/farm.jpg',
      status: 'Pending',
      createdAt: body.createdAt || new Date().toISOString(),
    };

    const saved = db.addSellerApplication(newApp);

    // Broadcast new seller application in real-time to Admin and all devices
    if (io) {
      io.emit('seller_application_submitted', saved);
      io.emit('application_created', saved);
    }

    return res.status(201).json(successResponse(saved, 'Seller application submitted for review'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'APPLICATION_FAILED', 500));
  }
});

// @route   GET /api/sellers/applications
// @desc    Get all seller applications for central moderation and sync
// @access  Public / Optional Auth
router.get('/applications', (req: Request, res: Response) => {
  try {
    const apps = db.getSellerApplications();
    return res.json(successResponse(apps, 'Seller applications retrieved'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'APPLICATIONS_FETCH_FAILED', 500));
  }
});

// @route   GET /api/sellers/application
// @desc    Get user seller application status
// @access  Public / Optional Auth
router.get('/application', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || Number(req.query.userId) || 0;
    const app = db.getSellerApplicationByUserId(userId);
    return res.json(successResponse(app || null, 'Application status retrieved'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'APPLICATION_FETCH_FAILED', 500));
  }
});

// @route   PUT /api/sellers/application/:id/review
// @desc    Review and approve/reject seller application centrally
// @access  Public / Optional Auth
router.put('/application/:id/review', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (status !== 'Approved' && status !== 'Rejected') {
      return res.status(400).json(errorResponse('Status must be Approved or Rejected', null, 'BAD_REQUEST', 400));
    }

    const updated = db.updateSellerApplicationStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json(errorResponse('Application not found', null, 'NOT_FOUND', 404));
    }

    // Add notification to the user
    db.addNotification({
      id: `notice-${Date.now()}`,
      userId: updated.userId,
      title: `Seller Application ${status}`,
      message:
        status === 'Approved'
          ? '🎉 Congratulations! Your farm has been verified. You can now list harvests on the Seller Dashboard.'
          : 'Your seller application could not be approved at this time. Please check your credentials.',
      href: status === 'Approved' ? '/seller-dashboard' : '/become-seller',
      category: 'Verification',
      readBy: [],
      createdAt: new Date().toISOString(),
    });

    // Real-time broadcast: unlock seller dashboard on user's device immediately!
    if (io) {
      io.emit('seller_application_reviewed', updated);
      io.emit('seller_application_updated', updated);
      if (status === 'Approved') {
        io.emit('role_granted', { userId: updated.userId, role: 'seller' });
      }
    }

    return res.json(successResponse(updated, `Seller application has been ${status.toLowerCase()}`));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'APPLICATION_REVIEW_FAILED', 500));
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

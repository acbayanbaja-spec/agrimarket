import { Router, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { db } from '../database/store';
import { successResponse, errorResponse } from '../utils/response';

const router = Router();

// All admin routes require admin role
router.use(authenticate, authorize('admin'));

// @route   GET /api/admin/dashboard
// @desc    Get master admin dashboard with full platform KPIs
// @access  Admin
router.get('/dashboard', (req: AuthRequest, res: Response) => {
  try {
    const users = db.getUsers();
    const products = db.getProducts();
    const orders = db.getOrders();
    const applications = db.getSellerApplications();
    const deliveries = db.getDeliveries();

    const gmv = orders.filter((o) => o.status === 'Delivered').reduce((sum, o) => sum + o.total, 0);
    const activeFarmers = users.filter((u) => u.roles.includes('seller')).length;
    const pendingApplications = applications.filter((a) => a.status === 'Pending').length;
    const inTransitDeliveries = deliveries.filter((d) => d.status === 'Out for delivery').length;

    return res.json(
      successResponse(
        {
          kpis: {
            gmv,
            totalOrders: orders.length,
            activeFarmers,
            totalUsers: users.length,
            activeListings: products.length,
            pendingApplications,
            inTransitDeliveries,
          },
          recentOrders: orders.slice(0, 10),
          recentApplications: applications.slice(0, 10),
          systemHealth: {
            status: 'operational',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            dataPersistence: 'active',
          },
        },
        'Admin dashboard loaded'
      )
    );
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'ADMIN_DASHBOARD_FAILED', 500));
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', (req: AuthRequest, res: Response) => {
  try {
    const users = db.getUsers().map(({ password_hash, ...safe }) => safe);
    return res.json(successResponse(users, 'All users loaded'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'USERS_FETCH_FAILED', 500));
  }
});

// @route   GET /api/admin/seller-applications
// @desc    Get seller applications
// @access  Admin
router.get('/seller-applications', (req: AuthRequest, res: Response) => {
  try {
    const applications = db.getSellerApplications();
    return res.json(successResponse(applications, 'Seller applications loaded'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'APPLICATIONS_FETCH_FAILED', 500));
  }
});

// @route   PUT /api/admin/seller-applications/:id
// @desc    Approve/reject seller application
// @access  Admin
router.put('/seller-applications/:id', (req: AuthRequest, res: Response) => {
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

    return res.json(successResponse(updated, `Seller application has been ${status.toLowerCase()}`));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'APPLICATION_REVIEW_FAILED', 500));
  }
});

export default router;

import { Router, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { db, SellerApplicationEntity } from '../database/store';
import { successResponse, errorResponse } from '../utils/response';
import { io } from '../index';

const router = Router();

// @route   POST /api/sellers/application
// @desc    Submit seller application with farm info (Authenticated user only)
// @access  Private (buyer)
router.post('/application', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;
    const user = req.user!;

    if (!body.farmName || !body.location) {
      return res.status(400).json(errorResponse('Farm name and location are required', null, 'BAD_REQUEST', 400));
    }

    const newApp: SellerApplicationEntity = {
      id: body.id || `app-${Date.now()}`,
      userId: user.id,
      name: body.name || `${user.email.split('@')[0]}`,
      farmName: String(body.farmName).trim(),
      location: String(body.location).trim(),
      description: body.description || '',
      phone: body.phone || '+639180000000',
      categories: body.categories || 'Vegetables',
      idType: body.idType || 'Government ID',
      idNumber: body.idNumber || 'N/A',
      idDocument: body.idDocument || '/images/farm.jpg',
      permitDocument: body.permitDocument || '/images/farm.jpg',
      farmPhoto: body.farmPhoto || '/images/farm.jpg',
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    const saved = db.addSellerApplication(newApp);

    // Securely broadcast new application ONLY to authorized administrators
    if (io) {
      io.to('role:admin').emit('seller_application_submitted', saved);
      io.to('role:admin').emit('application_created', saved);
    }

    return res.status(201).json(successResponse(saved, 'Seller application submitted for administrator review'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'APPLICATION_FAILED', 500));
  }
});

// @route   GET /api/sellers/applications
// @desc    Get all seller applications for central moderation and sync
// @access  Private (Admin only)
router.get('/applications', authenticate, authorize('admin'), (req: AuthRequest, res: Response) => {
  try {
    const apps = db.getSellerApplications();
    return res.json(successResponse(apps, 'Seller applications retrieved'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'APPLICATIONS_FETCH_FAILED', 500));
  }
});

// @route   GET /api/sellers/application
// @desc    Get current user seller application status
// @access  Private
router.get('/application', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const app = db.getSellerApplicationByUserId(userId);
    return res.json(successResponse(app || null, 'Application status retrieved'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'APPLICATION_FETCH_FAILED', 500));
  }
});

// @route   PUT /api/sellers/application/:id/review
// @desc    Review and approve/reject/request revision for seller application centrally
// @access  Private (Admin only)
router.put('/application/:id/review', authenticate, authorize('admin'), (req: AuthRequest, res: Response) => {
  try {
    const { status, reviewNotes } = req.body;
    const allowed = ['Approved', 'Rejected', 'Needs Revision'];
    if (!allowed.includes(status)) {
      return res.status(400).json(errorResponse('Status must be Approved, Rejected, or Needs Revision', null, 'BAD_REQUEST', 400));
    }

    const reviewerEmail = req.user!.email;
    const updated = db.updateSellerApplicationStatus(req.params.id, status, reviewNotes, reviewerEmail);
    if (!updated) {
      return res.status(404).json(errorResponse('Application not found', null, 'NOT_FOUND', 404));
    }

    // Determine message & title for notification
    let title = `Seller Application ${status}`;
    let message = '';
    let href = '/become-seller';

    if (status === 'Approved') {
      title = '🎉 Seller Verification Approved!';
      message = `Congratulations! ${updated.farmName} has been verified. You can now list harvests on the Seller Dashboard.`;
      href = '/seller-dashboard';
    } else if (status === 'Needs Revision') {
      title = '⚠️ Revisions Requested for Seller Application';
      message = reviewNotes
        ? `Administrator requested revisions for ${updated.farmName}: "${reviewNotes}". Please update and resubmit.`
        : `Administrator requested revisions for ${updated.farmName}. Please check your valid ID and documents.`;
      href = '/become-seller';
    } else {
      title = 'Seller Application Declined';
      message = reviewNotes
        ? `Your seller application could not be approved: "${reviewNotes}". Please contact support.`
        : 'Your seller application could not be approved at this time. Please check your credentials.';
      href = '/become-seller';
    }

    // Add notification to the user
    db.addNotification({
      id: `notice-${Date.now()}`,
      userId: updated.userId,
      title,
      message,
      href,
      category: 'Verification',
      readBy: [],
      createdAt: new Date().toISOString(),
    });

    // Record audit log
    db.addAuditLog({
      adminId: req.user?.id || 1,
      adminEmail: reviewerEmail,
      action:
        status === 'Approved'
          ? 'SELLER_APPLICATION_APPROVED'
          : status === 'Needs Revision'
          ? 'SELLER_APPLICATION_REVISION_REQUESTED'
          : 'SELLER_APPLICATION_REJECTED',
      targetType: 'seller_application',
      targetId: updated.id,
      details: `${status} seller application for "${updated.farmName}". Notes: "${reviewNotes || 'N/A'}"`,
      ipAddress: req.ip || '127.0.0.1',
    });

    // Real-time broadcast: unlock seller dashboard on user's device immediately!
    if (io) {
      io.emit('seller_application_reviewed', updated);
      io.emit('seller_application_updated', updated);
      if (status === 'Approved') {
        io.emit('role_granted', { userId: updated.userId, role: 'seller' });
      }
    }

    return res.json(successResponse(updated, `Seller application has been updated to: ${status}`));
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
    const emailOwnerMap: Record<string, number> = {
      'seller@agrimarket.com': 2,
      'seller.vegetables@agrimarket.com': 2,
      'seller.fruits@agrimarket.com': 13,
      'seller.midsayap@agrimarket.com': 13,
      'seller.rice@agrimarket.com': 15,
      'seller.tacurong@agrimarket.com': 15,
      'seller.grains@agrimarket.com': 12,
      'seller.koronadal@agrimarket.com': 12,
      'seller.fish@agrimarket.com': 17,
      'seller.lakesebu@agrimarket.com': 17,
      'seller.poultry@agrimarket.com': 16,
      'seller.livestock@agrimarket.com': 18,
      'seller.dairy@agrimarket.com': 18,
      'seller.supplies@agrimarket.com': 14,
      'seller.gensan@agrimarket.com': 14,
    };
    const effectiveUserId = user.email ? emailOwnerMap[user.email.toLowerCase()] || user.id : user.id;
    const sellerId = `seller-${effectiveUserId}`;
    const myProducts = db.getProducts(true).filter((p) => p.sellerId === sellerId || p.sellerUserId === effectiveUserId);
    const incomingOrders = db.getOrdersBySellerId(sellerId, effectiveUserId);

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

import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { db, CategoryEntity, CouponEntity } from '../database/store';
import { successResponse, errorResponse } from '../utils/response';
import { io } from '../index';

const router = Router();

// Helper to record sensitive administrative actions in persistent audit trail
const recordAuditLog = (
  req: AuthRequest,
  action: string,
  targetType: 'user' | 'seller_application' | 'product' | 'category' | 'promotion' | 'review' | 'order' | 'system',
  targetId: string,
  details: string
) => {
  try {
    const adminId = req.user?.id || 1;
    const adminEmail = req.user?.email || 'admin@agrimarket.com';
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
    return db.addAuditLog({
      adminId,
      adminEmail,
      action,
      targetType,
      targetId: String(targetId),
      details,
      ipAddress,
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
    return null;
  }
};

// All admin routes require authentication and admin role
router.use(authenticate, authorize('admin'));

// ==========================================
// 1. DASHBOARD & MASTER PLATFORM KPIS
// ==========================================
router.get('/dashboard', (req: AuthRequest, res: Response) => {
  try {
    const users = db.getUsers();
    const products = db.getProducts(true);
    const orders = db.getOrders();
    const applications = db.getSellerApplications();
    const deliveries = db.getDeliveries();
    const coupons = db.getAllCoupons();
    const reviews = db.getAllReviews();
    const auditLogs = db.getAuditLogs({ limit: 10 });

    const gmv = orders.filter((o) => o.status === 'Delivered').reduce((sum, o) => sum + o.total, 0);
    const activeFarmers = users.filter((u) => u.roles.includes('seller') && u.is_active !== false).length;
    const suspendedUsers = users.filter((u) => u.is_active === false).length;
    const pendingApplications = applications.filter((a) => a.status === 'Pending').length;
    const revisionApplications = applications.filter((a) => a.status === 'Needs Revision').length;
    const inTransitDeliveries = deliveries.filter((d) => d.status === 'Out for delivery').length;
    const flaggedListings = products.filter((p) => p.moderationStatus === 'flagged' || p.moderationStatus === 'rejected').length;
    const activeCoupons = coupons.filter((c) => c.isActive).length;

    return res.json(
      successResponse(
        {
          kpis: {
            gmv,
            totalOrders: orders.length,
            totalUsers: users.length,
            activeFarmers,
            suspendedUsers,
            activeListings: products.filter((p) => p.isActive !== false && !p.isUnlisted).length,
            totalListings: products.length,
            pendingApplications,
            revisionApplications,
            flaggedListings,
            inTransitDeliveries,
            activePromotions: activeCoupons,
            totalReviews: reviews.length,
          },
          recentOrders: orders.slice(0, 10),
          recentApplications: applications.slice(0, 10),
          recentAuditLogs: auditLogs,
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

// ==========================================
// 2. REGISTERED ACCOUNTS & ACCESS MANAGEMENT
// ==========================================

// @route   GET /api/admin/users
// @desc    Get all registered accounts with status and role filtering
router.get('/users', (req: AuthRequest, res: Response) => {
  try {
    const { search, role, status } = req.query;
    let users = db.getUsers().map(({ password_hash, ...safe }) => safe);

    if (search) {
      const q = String(search).toLowerCase();
      users = users.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
          (u.phone && u.phone.includes(q))
      );
    }

    if (role && role !== 'all') {
      users = users.filter((u) => u.roles.includes(String(role).toLowerCase()));
    }

    if (status && status !== 'all') {
      if (status === 'suspended') {
        users = users.filter((u) => u.is_active === false);
      } else if (status === 'active') {
        users = users.filter((u) => u.is_active !== false);
      }
    }

    return res.json(successResponse(users, 'Registered accounts retrieved'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'USERS_FETCH_FAILED', 500));
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Manage account access: suspend or reactivate account
router.put('/users/:id/status', (req: AuthRequest, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const { isActive, reason } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json(errorResponse('isActive boolean required', null, 'BAD_REQUEST', 400));
    }

    const targetUser = db.getUserById(userId);
    if (!targetUser) {
      return res.status(404).json(errorResponse('User not found', null, 'NOT_FOUND', 404));
    }

    // Prevent suspending the master superadmin
    if (targetUser.id === 1 && !isActive) {
      return res.status(400).json(errorResponse('Master system administrator cannot be suspended', null, 'FORBIDDEN', 403));
    }

    const suspensionReason = reason?.trim() || (isActive ? '' : 'Violated AgriMarket platform policies');
    const updated = db.setUserActiveStatus(userId, isActive, suspensionReason);

    // Audit log
    const action = isActive ? 'USER_REACTIVATED' : 'USER_SUSPENDED';
    const auditDetails = isActive
      ? `Reactivated account for user ${targetUser.email} (ID: ${userId}).`
      : `Suspended account for user ${targetUser.email} (ID: ${userId}). Reason: "${suspensionReason}".`;
    recordAuditLog(req, action, 'user', String(userId), auditDetails);

    // Notification to user
    db.addNotification({
      id: `notice-${Date.now()}`,
      userId: userId,
      title: isActive ? 'Account Access Restored' : 'Account Suspended',
      message: isActive
        ? 'Your AgriMarket account access has been fully restored by an administrator.'
        : `Your account was suspended by administration. Reason: ${suspensionReason}. Contact support to appeal.`,
      category: 'Security',
      readBy: [],
      createdAt: new Date().toISOString(),
    });

    // Real-time broadcast
    if (io) {
      io.emit('account_status_changed', { userId, isActive, reason: suspensionReason });
      io.emit('user_updated', updated);
    }

    return res.json(
      successResponse(
        updated,
        isActive ? `User account ${targetUser.email} reactivated` : `User account ${targetUser.email} suspended`
      )
    );
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'USER_STATUS_UPDATE_FAILED', 500));
  }
});

// @route   PUT /api/admin/users/:id/roles
// @desc    Manage user account access roles (e.g. buyer, seller, delivery, admin)
router.put('/users/:id/roles', (req: AuthRequest, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const { roles } = req.body;

    if (!Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json(errorResponse('At least one role is required', null, 'BAD_REQUEST', 400));
    }

    const targetUser = db.getUserById(userId);
    if (!targetUser) {
      return res.status(404).json(errorResponse('User not found', null, 'NOT_FOUND', 404));
    }

    const updated = db.setUserRoles(userId, roles);

    // Audit log
    recordAuditLog(
      req,
      'USER_ROLES_UPDATED',
      'user',
      String(userId),
      `Updated access roles for ${targetUser.email} to: [${roles.join(', ')}] (Previous: [${targetUser.roles.join(', ')}]).`
    );

    if (io) {
      io.emit('user_roles_updated', { userId, roles });
      io.emit('user_updated', updated);
    }

    return res.json(successResponse(updated, `Roles updated for user ${targetUser.email}`));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'USER_ROLES_UPDATE_FAILED', 500));
  }
});

// @route   POST /api/admin/riders
// @desc    Admin creates a Rider account with name, contact info, and login credentials
router.post('/riders', async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, phone, email, password } = req.body;

    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json(errorResponse('Rider first and last name are required', null, 'BAD_REQUEST', 400));
    }
    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json(errorResponse('Rider email and login credentials (password) are required', null, 'BAD_REQUEST', 400));
    }
    if (!phone?.trim()) {
      return res.status(400).json(errorResponse('Rider contact phone information is required', null, 'BAD_REQUEST', 400));
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.getUserByEmail(cleanEmail);
    if (existing) {
      return res.status(400).json(errorResponse('An account with this email already exists', null, 'EMAIL_EXISTS', 400));
    }

    const passwordHash = await bcrypt.hash(password.trim(), 10);

    const newRider = db.addUser({
      email: cleanEmail,
      password_hash: passwordHash,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
      roles: ['delivery'],
      is_verified: true,
      is_active: true,
      created_at: new Date().toISOString(),
    });

    // Also attempt MySQL insert if connected
    if (db.getIsMySqlConnected()) {
      try {
        const conn = await pool.getConnection();
        try {
          const [result] = await conn.query(
            'INSERT INTO users (email, password_hash, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?)',
            [cleanEmail, passwordHash, firstName.trim(), lastName.trim(), phone.trim()]
          );
          const userId = (result as any).insertId;
          const [roles] = await conn.query('SELECT id FROM roles WHERE name = ?', ['delivery']);
          const roleId = (roles as any)[0]?.id || 4;
          await conn.query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, roleId]);
        } finally {
          conn.release();
        }
      } catch (mysqlErr) {
        console.warn('MySQL rider sync notice:', mysqlErr);
      }
    }

    // Audit log
    recordAuditLog(
      req,
      'RIDER_ACCOUNT_CREATED',
      'user',
      String(newRider.id),
      `Admin created new Rider account for ${newRider.first_name} ${newRider.last_name} (${cleanEmail}, Phone: ${phone.trim()}).`
    );

    if (io) {
      io.emit('rider_created', {
        id: newRider.id,
        first_name: newRider.first_name,
        last_name: newRider.last_name,
        email: newRider.email,
        phone: newRider.phone,
        roles: newRider.roles,
      });
      io.emit('user_created', newRider);
    }

    const { password_hash, ...safeRider } = newRider;
    return res.status(201).json(successResponse(safeRider, 'Rider account created successfully'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'CREATE_RIDER_FAILED', 500));
  }
});

// @route   GET /api/admin/riders
// @desc    Get all active delivery riders
router.get('/riders', (req: AuthRequest, res: Response) => {
  try {
    const riders = db
      .getUsers()
      .filter((u) => u.roles.includes('delivery'))
      .map(({ password_hash, ...safe }) => safe);
    return res.json(successResponse(riders, 'Riders list retrieved'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'FETCH_RIDERS_FAILED', 500));
  }
});

// ==========================================
// 3. SELLER KYC APPLICATIONS (APPROVE, REJECT, REQUEST REVISIONS)
// ==========================================

// @route   GET /api/admin/seller-applications
// @desc    Get seller KYC applications with status filtering
router.get('/seller-applications', (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    let applications = db.getSellerApplications();
    if (status && status !== 'all') {
      applications = applications.filter((a) => a.status.toLowerCase() === String(status).toLowerCase());
    }
    return res.json(successResponse(applications, 'Seller applications loaded'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'APPLICATIONS_FETCH_FAILED', 500));
  }
});

// @route   PUT /api/admin/seller-applications/:id
// @desc    Review seller application: approve, reject, or request revisions
router.put('/seller-applications/:id', (req: AuthRequest, res: Response) => {
  try {
    const { status, reviewNotes } = req.body;
    const allowed = ['Approved', 'Rejected', 'Needs Revision'];

    if (!allowed.includes(status)) {
      return res.status(400).json(errorResponse('Status must be Approved, Rejected, or Needs Revision', null, 'BAD_REQUEST', 400));
    }

    const reviewerEmail = req.user?.email || 'admin@agrimarket.com';
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
      message = `Congratulations! ${updated.farmName} has been verified. You can now post harvest listings and manage regional orders.`;
      href = '/seller-dashboard';
    } else if (status === 'Needs Revision') {
      title = '⚠️ Action Required: Revisions Requested on Seller Application';
      message = reviewNotes
        ? `Administrator requested revisions for ${updated.farmName}: "${reviewNotes}". Please update your details/documents and resubmit.`
        : `Administrator requested revisions for ${updated.farmName}. Please check your valid ID and documents.`;
      href = '/become-seller';
    } else {
      title = 'Seller Application Declined';
      message = reviewNotes
        ? `Your application for ${updated.farmName} was not approved: "${reviewNotes}". Please contact support for guidance.`
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

    // Audit log
    const auditAction =
      status === 'Approved'
        ? 'SELLER_APPLICATION_APPROVED'
        : status === 'Needs Revision'
        ? 'SELLER_APPLICATION_REVISION_REQUESTED'
        : 'SELLER_APPLICATION_REJECTED';

    recordAuditLog(
      req,
      auditAction,
      'seller_application',
      updated.id,
      `${status} application for farm "${updated.farmName}" (User ID: ${updated.userId}). Feedback: "${reviewNotes || 'None'}".`
    );

    // Real-time broadcast
    if (io) {
      io.emit('seller_application_reviewed', updated);
      io.emit('seller_application_updated', updated);
      if (status === 'Approved') {
        io.emit('role_granted', { userId: updated.userId, role: 'seller' });
      }
    }

    return res.json(successResponse(updated, `Seller application updated to: ${status}`));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'APPLICATION_REVIEW_FAILED', 500));
  }
});

// ==========================================
// 4. PRODUCT LISTINGS & CONTENT MODERATION
// ==========================================

// @route   GET /api/admin/products
// @desc    Get all catalog products with moderation status and seller details
router.get('/products', (req: AuthRequest, res: Response) => {
  try {
    const { search, category, moderationStatus } = req.query;
    let products = db.getProducts(true);

    if (category && category !== 'All') {
      products = products.filter((p) => p.category.toLowerCase() === String(category).toLowerCase());
    }

    if (search) {
      const q = String(search).toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.seller.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q)
      );
    }

    if (moderationStatus && moderationStatus !== 'all') {
      if (moderationStatus === 'live') {
        products = products.filter((p) => p.isActive !== false && !p.isUnlisted && p.moderationStatus !== 'rejected');
      } else if (moderationStatus === 'unlisted') {
        products = products.filter((p) => p.isUnlisted || p.isActive === false);
      } else if (moderationStatus === 'flagged') {
        products = products.filter((p) => p.moderationStatus === 'flagged');
      } else if (moderationStatus === 'rejected') {
        products = products.filter((p) => p.moderationStatus === 'rejected');
      }
    }

    return res.json(successResponse(products, 'Admin catalog retrieved'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'PRODUCTS_FETCH_FAILED', 500));
  }
});

// @route   PUT /api/admin/products/:id/moderate
// @desc    Moderate listings: flag, delist, reject inappropriate or approve listings
router.put('/products/:id/moderate', (req: AuthRequest, res: Response) => {
  try {
    const { action, reason } = req.body;
    const allowed = ['approve', 'flag', 'delist', 'reject'];

    if (!allowed.includes(action)) {
      return res.status(400).json(errorResponse('Action must be approve, flag, delist, or reject', null, 'BAD_REQUEST', 400));
    }

    const adminEmail = req.user?.email || 'admin@agrimarket.com';
    const product = db.moderateProduct(req.params.id, action, reason, adminEmail);
    if (!product) {
      return res.status(404).json(errorResponse('Product not found', null, 'NOT_FOUND', 404));
    }

    // Audit log
    const auditAction =
      action === 'approve'
        ? 'PRODUCT_APPROVED'
        : action === 'flag'
        ? 'PRODUCT_FLAGGED'
        : action === 'delist'
        ? 'PRODUCT_DELISTED'
        : 'PRODUCT_REJECTED';

    recordAuditLog(
      req,
      auditAction,
      'product',
      product.id,
      `Listing "${product.name}" moderated: action="${action}". Reason: "${reason || 'N/A'}". By: ${adminEmail}.`
    );

    // Notify seller if product was flagged or delisted/rejected
    if (product.sellerUserId && action !== 'approve') {
      db.addNotification({
        id: `notice-${Date.now()}`,
        userId: product.sellerUserId,
        title: action === 'flag' ? '⚠️ Product Listing Flagged' : 'Listing Delisted by Moderator',
        message: `Your listing "${product.name}" was moderated: ${reason || 'Inappropriate or invalid information'}.`,
        href: '/seller-dashboard',
        category: 'Moderation',
        readBy: [],
        createdAt: new Date().toISOString(),
      });
    }

    // Real-time broadcast
    if (io) {
      io.emit('product_moderated', product);
      io.emit('product_updated', product);
      io.emit('catalog_changed', { action: 'moderated', product });
    }

    return res.json(successResponse(product, `Listing "${product.name}" moderated: ${action}`));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'PRODUCT_MODERATION_FAILED', 500));
  }
});

// @route   DELETE /api/admin/products/:id
// @desc    Permanently delete inappropriate or invalid product listing
router.delete('/products/:id', (req: AuthRequest, res: Response) => {
  try {
    const existing = db.getProductById(req.params.id);
    if (!existing) {
      return res.status(404).json(errorResponse('Product not found', null, 'NOT_FOUND', 404));
    }

    const ok = db.deleteProduct(req.params.id);
    if (!ok) {
      return res.status(404).json(errorResponse('Product not found', null, 'NOT_FOUND', 404));
    }

    // Audit log
    recordAuditLog(
      req,
      'PRODUCT_DELETED',
      'product',
      req.params.id,
      `Permanently removed invalid listing "${existing.name}" (Seller: ${existing.seller}, ID: ${req.params.id}).`
    );

    if (io) {
      io.emit('product_deleted', { id: req.params.id });
      io.emit('catalog_changed', { action: 'deleted', id: req.params.id });
    }

    return res.json(successResponse({ id: req.params.id }, `Listing "${existing.name}" permanently deleted`));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'PRODUCT_DELETE_FAILED', 500));
  }
});

// ==========================================
// 5. CATEGORIES MAINTENANCE (CRUD)
// ==========================================

// @route   GET /api/admin/categories
// @desc    Get all categories with active listing counts
router.get('/categories', (req: AuthRequest, res: Response) => {
  try {
    const categories = db.getCategories();
    const products = db.getProducts(true);

    const enriched = categories.map((cat) => ({
      ...cat,
      productCount: products.filter(
        (p) => p.category.toLowerCase() === cat.name.toLowerCase() && p.isActive !== false && !p.isUnlisted
      ).length,
      totalProductCount: products.filter((p) => p.category.toLowerCase() === cat.name.toLowerCase()).length,
    }));

    return res.json(successResponse(enriched, 'Categories retrieved'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'CATEGORIES_FETCH_FAILED', 500));
  }
});

// @route   POST /api/admin/categories
// @desc    Create a new agricultural category
router.post('/categories', (req: AuthRequest, res: Response) => {
  try {
    const { name, description, icon, imageUrl } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json(errorResponse('Category name is required', null, 'BAD_REQUEST', 400));
    }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newCategory: CategoryEntity = {
      id: req.body.id || `cat-${slug}`,
      name: name.trim(),
      description: description?.trim() || 'Agricultural harvests and supplies',
      icon: icon?.trim() || 'Sprout',
      imageUrl: imageUrl?.trim() || '/images/farm.jpg',
    };

    const created = db.addCategory(newCategory);

    // Audit log
    recordAuditLog(
      req,
      'CATEGORY_CREATED',
      'category',
      created.id,
      `Created agricultural category "${created.name}" (ID: ${created.id}).`
    );

    if (io) {
      io.emit('category_created', created);
      io.emit('categories_changed', { action: 'created', category: created });
    }

    return res.status(201).json(successResponse(created, `Category "${created.name}" created successfully`));
  } catch (error: any) {
    return res.status(400).json(errorResponse(error.message, null, 'CATEGORY_CREATE_FAILED', 400));
  }
});

// @route   PUT /api/admin/categories/:id
// @desc    Update an agricultural category
router.put('/categories/:id', (req: AuthRequest, res: Response) => {
  try {
    const { name, description, icon, imageUrl } = req.body;
    const existing = db.getCategoryById(req.params.id);
    if (!existing) {
      return res.status(404).json(errorResponse('Category not found', null, 'NOT_FOUND', 404));
    }

    const updated = db.updateCategory(req.params.id, {
      name: name !== undefined ? name.trim() : existing.name,
      description: description !== undefined ? description.trim() : existing.description,
      icon: icon !== undefined ? icon.trim() : existing.icon,
      imageUrl: imageUrl !== undefined ? imageUrl.trim() : existing.imageUrl,
    });

    // Audit log
    recordAuditLog(
      req,
      'CATEGORY_UPDATED',
      'category',
      req.params.id,
      `Updated category "${existing.name}" (New Name: "${updated?.name}").`
    );

    if (io) {
      io.emit('category_updated', updated);
      io.emit('categories_changed', { action: 'updated', category: updated });
    }

    return res.json(successResponse(updated, 'Category updated successfully'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'CATEGORY_UPDATE_FAILED', 500));
  }
});

// @route   DELETE /api/admin/categories/:id
// @desc    Delete an agricultural category
router.delete('/categories/:id', (req: AuthRequest, res: Response) => {
  try {
    const existing = db.getCategoryById(req.params.id);
    if (!existing) {
      return res.status(404).json(errorResponse('Category not found', null, 'NOT_FOUND', 404));
    }

    const ok = db.deleteCategory(req.params.id);
    if (!ok) {
      return res.status(404).json(errorResponse('Category not found', null, 'NOT_FOUND', 404));
    }

    // Audit log
    recordAuditLog(
      req,
      'CATEGORY_DELETED',
      'category',
      req.params.id,
      `Deleted category "${existing.name}" (ID: ${req.params.id}).`
    );

    if (io) {
      io.emit('category_deleted', { id: req.params.id });
      io.emit('categories_changed', { action: 'deleted', id: req.params.id });
    }

    return res.json(successResponse({ id: req.params.id }, `Category "${existing.name}" deleted successfully`));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'CATEGORY_DELETE_FAILED', 500));
  }
});

// ==========================================
// 6. PROMOTIONAL DISCOUNTS & COUPONS
// ==========================================

// @route   GET /api/admin/promotions
// @desc    Get all promotional discounts and vouchers
router.get('/promotions', (req: AuthRequest, res: Response) => {
  try {
    const coupons = db.getAllCoupons();
    return res.json(successResponse(coupons, 'Promotional discounts loaded'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'PROMOTIONS_FETCH_FAILED', 500));
  }
});

// @route   POST /api/admin/promotions
// @desc    Create promotional discount code
router.post('/promotions', (req: AuthRequest, res: Response) => {
  try {
    const { code, discount, type, minSpend, description, isActive } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json(errorResponse('Promotion code is required', null, 'BAD_REQUEST', 400));
    }

    if (discount === undefined || Number(discount) < 0) {
      return res.status(400).json(errorResponse('Valid discount value is required', null, 'BAD_REQUEST', 400));
    }

    const cleanCode = code.trim().toUpperCase();
    const newCoupon: CouponEntity = {
      code: cleanCode,
      discount: Number(discount),
      type: type || 'fixed',
      minSpend: Number(minSpend || 0),
      description: description?.trim() || `${cleanCode} discount`,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdAt: new Date().toISOString(),
    };

    const created = db.addCoupon(newCoupon);

    // Audit log
    recordAuditLog(
      req,
      'PROMOTION_CREATED',
      'promotion',
      cleanCode,
      `Created promotional discount "${cleanCode}": ${newCoupon.discount} (${newCoupon.type}), minSpend: ₱${newCoupon.minSpend}.`
    );

    // Broadcast announcement notification to buyers
    db.addNotification({
      id: `notice-promo-${Date.now()}`,
      userId: 'all',
      title: `🎉 New Promo Voucher: ${cleanCode}`,
      message: `Enjoy ${newCoupon.description}! Apply code ${cleanCode} on your checkout basket.`,
      href: '/marketplace',
      category: 'Promotion',
      readBy: [],
      createdAt: new Date().toISOString(),
    });

    if (io) {
      io.emit('promotion_created', created);
      io.emit('promotions_changed', { action: 'created', coupon: created });
    }

    return res.status(201).json(successResponse(created, `Promotion code "${cleanCode}" created successfully`));
  } catch (error: any) {
    return res.status(400).json(errorResponse(error.message, null, 'PROMOTION_CREATE_FAILED', 400));
  }
});

// @route   PUT /api/admin/promotions/:code
// @desc    Update or toggle promotional discount
router.put('/promotions/:code', (req: AuthRequest, res: Response) => {
  try {
    const targetCode = req.params.code.toUpperCase();
    const updated = db.updateCoupon(targetCode, req.body);
    if (!updated) {
      return res.status(404).json(errorResponse('Promotion not found', null, 'NOT_FOUND', 404));
    }

    // Audit log
    recordAuditLog(
      req,
      'PROMOTION_UPDATED',
      'promotion',
      targetCode,
      `Updated promotion "${targetCode}". Active status: ${updated.isActive}. Discount: ${updated.discount}.`
    );

    if (io) {
      io.emit('promotion_updated', updated);
      io.emit('promotions_changed', { action: 'updated', coupon: updated });
    }

    return res.json(successResponse(updated, `Promotion "${targetCode}" updated successfully`));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'PROMOTION_UPDATE_FAILED', 500));
  }
});

// @route   DELETE /api/admin/promotions/:code
// @desc    Delete promotional discount
router.delete('/promotions/:code', (req: AuthRequest, res: Response) => {
  try {
    const targetCode = req.params.code.toUpperCase();
    const ok = db.deleteCoupon(targetCode);
    if (!ok) {
      return res.status(404).json(errorResponse('Promotion not found', null, 'NOT_FOUND', 404));
    }

    // Audit log
    recordAuditLog(
      req,
      'PROMOTION_DELETED',
      'promotion',
      targetCode,
      `Permanently deleted promotional discount code "${targetCode}".`
    );

    if (io) {
      io.emit('promotion_deleted', { code: targetCode });
      io.emit('promotions_changed', { action: 'deleted', code: targetCode });
    }

    return res.json(successResponse({ code: targetCode }, `Promotion "${targetCode}" removed`));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'PROMOTION_DELETE_FAILED', 500));
  }
});

// ==========================================
// 7. PRODUCT REVIEWS MODERATION
// ==========================================

// @route   GET /api/admin/reviews
// @desc    Get all product reviews across the marketplace
router.get('/reviews', (req: AuthRequest, res: Response) => {
  try {
    const { search, status, rating } = req.query;
    let reviews = db.getAllReviews();

    if (status && status !== 'all') {
      reviews = reviews.filter((r) => (r.status || 'published') === status);
    }

    if (rating && rating !== 'all') {
      reviews = reviews.filter((r) => r.rating === Number(rating));
    }

    if (search) {
      const q = String(search).toLowerCase();
      reviews = reviews.filter(
        (r) =>
          r.comment.toLowerCase().includes(q) ||
          r.userName.toLowerCase().includes(q) ||
          r.productName?.toLowerCase().includes(q)
      );
    }

    return res.json(successResponse(reviews, 'All product reviews loaded'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'REVIEWS_FETCH_FAILED', 500));
  }
});

// @route   PUT /api/admin/reviews/:id/moderate
// @desc    Moderate product review (publish, hide, or flag inappropriate review)
router.put('/reviews/:id/moderate', (req: AuthRequest, res: Response) => {
  try {
    const { status, reason } = req.body;
    const allowed = ['published', 'hidden', 'flagged'];
    if (!allowed.includes(status)) {
      return res.status(400).json(errorResponse('Status must be published, hidden, or flagged', null, 'BAD_REQUEST', 400));
    }

    const updated = db.moderateReview(req.params.id, status, reason);
    if (!updated) {
      return res.status(404).json(errorResponse('Review not found', null, 'NOT_FOUND', 404));
    }

    // Audit log
    recordAuditLog(
      req,
      'REVIEW_MODERATED',
      'review',
      req.params.id,
      `Moderated customer review ID "${req.params.id}": status set to "${status}". Reason: "${reason || 'N/A'}".`
    );

    if (io) {
      io.emit('review_moderated', updated);
    }

    return res.json(successResponse(updated, `Review moderation updated to: ${status}`));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'REVIEW_MODERATION_FAILED', 500));
  }
});

// @route   DELETE /api/admin/reviews/:id
// @desc    Permanently delete inappropriate or spam product review
router.delete('/reviews/:id', (req: AuthRequest, res: Response) => {
  try {
    const ok = db.deleteReview(req.params.id);
    if (!ok) {
      return res.status(404).json(errorResponse('Review not found', null, 'NOT_FOUND', 404));
    }

    // Audit log
    recordAuditLog(
      req,
      'REVIEW_DELETED',
      'review',
      req.params.id,
      `Permanently deleted customer review ID "${req.params.id}".`
    );

    if (io) {
      io.emit('review_deleted', { id: req.params.id });
    }

    return res.json(successResponse({ id: req.params.id }, 'Review deleted and product ratings recalculated'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'REVIEW_DELETE_FAILED', 500));
  }
});

// ==========================================
// 8. AUDIT LOGS INSPECTION
// ==========================================

// @route   GET /api/admin/audit-logs
// @desc    Inspect system audit logs for sensitive administrative actions
router.get('/audit-logs', (req: AuthRequest, res: Response) => {
  try {
    const { targetType, action, search, limit } = req.query;

    const logs = db.getAuditLogs({
      targetType: targetType ? String(targetType) : undefined,
      action: action ? String(action) : undefined,
      search: search ? String(search) : undefined,
      limit: limit ? Number(limit) : 100,
    });

    const allLogs = db.getAuditLogs();
    const actionCounts = allLogs.reduce((acc: Record<string, number>, l) => {
      acc[l.action] = (acc[l.action] || 0) + 1;
      return acc;
    }, {});

    return res.json(
      successResponse(
        {
          logs,
          total: logs.length,
          allTotal: allLogs.length,
          actionCounts,
        },
        'Administrative audit trail retrieved'
      )
    );
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'AUDIT_LOGS_FETCH_FAILED', 500));
  }
});

export default router;

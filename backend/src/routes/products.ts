import { Router, Response } from 'express';
import { db, ProductEntity } from '../database/store';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { io } from '../index';
import {
  broadcastProductCreated,
  broadcastProductUpdated,
  broadcastProductUnlisted,
  broadcastProductDeleted,
} from '../sockets';
import { isAllowedUnit, relatedProducts, searchProducts, suggestProducts } from '../lib/productSearch';

const router = Router();

// Helper to determine if user can manage the given product
function canManageProduct(user: { id: number; roles: string[]; email?: string } | undefined, product: ProductEntity): boolean {
  if (!user) return false;
  if (user.roles.includes('admin')) return true;
  if (!user.roles.includes('seller')) return false;

  // Check seller ownership
  return (
    product.sellerUserId === user.id ||
    product.sellerId === `seller-${user.id}` ||
    product.sellerId === `user-${user.id}`
  );
}

// @route   GET /api/products
// @desc    Get all products from central database with filters
// @access  Public
router.get('/', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    db.assertPersistentStore();
    const { category, search, sellerId, seller, minPrice, maxPrice, includeInactive, location, organic, stock, sort, page, pageSize } =
      req.query;
    const user = req.user;

    const isAdmin = Boolean(user && user.roles.includes('admin'));
    const isSeller = Boolean(user && user.roles.includes('seller'));

    const showInactive = includeInactive === 'true' && (isAdmin || isSeller);
    const catalog = db.getProducts(showInactive);
    const result = searchProducts(catalog, {
      category: category ? String(category) : undefined,
      search: search ? String(search) : undefined,
      sellerId: sellerId ? String(sellerId) : undefined,
      seller: seller ? String(seller) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      location: location ? String(location) : undefined,
      organic: organic === 'true',
      stock: stock === 'in' || stock === 'low' || stock === 'out' ? stock : 'all',
      sort: sort ? String(sort) : 'featured',
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : includeInactive === 'true' ? 500 : 24,
      maxPageSize: includeInactive === 'true' ? 500 : 48,
    });

    return res.json(
      successResponse(
        {
          products: result.products,
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
        'Products retrieved successfully from central database'
      )
    );
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json(errorResponse(error.message, null, error.code || 'PRODUCTS_FETCH_FAILED', statusCode));
  }
});

router.get('/suggestions', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    db.assertPersistentStore();
    const q = String(req.query.q || '');
    const suggestions = suggestProducts(db.getProducts(false), q, 8).map((p) => ({
      id: p.id,
      name: p.name,
      seller: p.seller,
      price: p.price,
      image: p.image,
      category: p.category,
      location: p.location,
    }));
    return res.json(successResponse({ suggestions }, 'Search suggestions retrieved'));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json(errorResponse(error.message, null, error.code || 'SUGGESTIONS_FAILED', statusCode));
  }
});

// @route   GET /api/products/:id
// @desc    Get product by ID from central database
// @access  Public
router.get('/:id/related', (req: AuthRequest, res: Response) => {
  try {
    const product = db.getProductById(req.params.id);
    if (!product || product.isDeleted) {
      return res.status(404).json(errorResponse('Product not found or has been removed', null, 'NOT_FOUND', 404));
    }
    const related = relatedProducts(db.getProducts(false), product, 4);
    return res.json(successResponse({ products: related }, 'Related harvests retrieved'));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json(errorResponse(error.message, null, error.code || 'RELATED_FETCH_FAILED', statusCode));
  }
});

router.get('/:id/inventory', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const product = db.getProductById(req.params.id);
    if (!product || product.isDeleted) {
      return res.status(404).json(errorResponse('Product not found', null, 'NOT_FOUND', 404));
    }
    if (!canManageProduct(req.user, product)) {
      return res.status(403).json(errorResponse('You can view inventory only for your own listings', null, 'FORBIDDEN', 403));
    }
    return res.json(
      successResponse({ movements: db.getInventoryMovements(req.params.id), stock: product.stock, unit: product.unit }, 'Inventory history retrieved')
    );
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json(errorResponse(error.message, null, error.code || 'INVENTORY_FETCH_FAILED', statusCode));
  }
});

router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const product = db.getProductById(req.params.id);
    if (!product || product.isDeleted) {
      return res.status(404).json(errorResponse('Product not found or has been removed', null, 'NOT_FOUND', 404));
    }

    return res.json(successResponse({ product }, 'Product retrieved successfully'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'PRODUCT_FETCH_FAILED', 500));
  }
});

// @route   POST /api/products
// @desc    Create new product listing in central database and broadcast to all users
// @access  Private (Seller, Admin)
router.post('/', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json(errorResponse('Authentication required to create a harvest listing', null, 'UNAUTHORIZED', 401));
    }

    const isAdmin = user.roles.includes('admin');
    const isSeller = user.roles.includes('seller');

    if (!isAdmin && !isSeller) {
      return res.status(403).json(errorResponse('Only approved sellers and administrators can create product listings', null, 'FORBIDDEN', 403));
    }

    const body = req.body;
    if (!body.name || !body.price) {
      return res.status(400).json(errorResponse('Product name and price are required', null, 'BAD_REQUEST', 400));
    }
    if (body.unit && !isAllowedUnit(body.unit)) {
      return res.status(400).json(
        errorResponse('Use an agricultural unit such as kg, g, sack, bundle, piece, tray, or bunch', null, 'INVALID_UNIT', 400)
      );
    }

    const sellerUserId = isAdmin && body.sellerUserId ? Number(body.sellerUserId) : user.id;
    const sellerId = body.sellerId || (sellerUserId ? `seller-${sellerUserId}` : 'seller-default');
    const anyUser = user as any;
    const sellerName = body.seller || (anyUser?.firstName ? `${anyUser.firstName} ${anyUser.lastName} Farm` : 'SOCCSKSARGEN Farm Partner');

    const newProduct: ProductEntity = {
      id: body.id || `prod-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      name: String(body.name).trim(),
      category: body.category || 'Vegetables',
      price: Math.max(1, Number(body.price)),
      unit: body.unit || 'kg',
      stock: Math.max(0, Number(body.stock ?? 20)),
      rating: Number(body.rating ?? 5.0),
      reviews: Number(body.reviews ?? 0),
      seller: sellerName,
      sellerId,
      sellerUserId,
      location: body.location || 'Koronadal City, South Cotabato',
      image: body.image || '/images/farm.jpg',
      photos: Array.isArray(body.photos) && body.photos.length ? body.photos : [body.image || '/images/farm.jpg'],
      description: body.description || '',
      organic: Boolean(body.organic),
      tradeable: body.tradeable ?? true,
      lat: Number(body.lat || 6.5004),
      lng: Number(body.lng || 124.8436),
      priceHistory: body.priceHistory || [{ date: new Date().toISOString().slice(0, 10), price: Number(body.price) }],
      created_at: new Date().toISOString(),
      isActive: true,
      is_active: true,
      isUnlisted: false,
      isDeleted: false,
      availabilityStatus: Number(body.stock ?? 20) === 0 ? 'out_of_stock' : Number(body.stock ?? 20) <= 10 ? 'low_stock' : 'in_stock',
    };

    const saved = db.addProduct(newProduct);

    // Broadcast across all connected devices in real time
    if (io) {
      broadcastProductCreated(io, saved);
    }

    return res.status(201).json(
      successResponse(
        { product: saved },
        'Product created and listed successfully across all devices in central database'
      )
    );
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'PRODUCT_CREATE_FAILED', 500));
  }
});

// @route   PUT /api/products/:id/unlist
// @desc    Unlist or disable product centrally (immediately disappears from all buyers)
// @access  Private (Seller of product, Admin)
router.put('/:id/unlist', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json(errorResponse('Authentication required to modify listing availability', null, 'UNAUTHORIZED', 401));
    }

    const product = db.getProductById(req.params.id);
    if (!product || product.isDeleted) {
      return res.status(404).json(errorResponse('Product not found', null, 'NOT_FOUND', 404));
    }

    if (!canManageProduct(user, product)) {
      return res.status(403).json(errorResponse('You can manage only your own product listings', null, 'FORBIDDEN', 403));
    }

    const unlisted = req.body.unlisted !== undefined ? Boolean(req.body.unlisted) : true;
    const updated = db.unlistProduct(req.params.id, unlisted);

    if (io && updated) {
      broadcastProductUnlisted(io, req.params.id, unlisted, updated);
    }

    return res.json(
      successResponse(
        { product: updated },
        unlisted
          ? 'Product unlisted and deactivated from new purchases'
          : 'Product relisted and now available on all devices'
      )
    );
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'PRODUCT_UNLIST_FAILED', 500));
  }
});

// @route   PUT /api/products/:id
// @desc    Update product stock, price, or details centrally in database
// @access  Private (Seller of product, Admin)
router.put('/:id', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json(errorResponse('Authentication required to update product', null, 'UNAUTHORIZED', 401));
    }

    const product = db.getProductById(req.params.id);
    if (!product || product.isDeleted) {
      return res.status(404).json(errorResponse('Product not found', null, 'NOT_FOUND', 404));
    }

    if (!canManageProduct(user, product)) {
      return res.status(403).json(errorResponse('You can manage only your own product listings', null, 'FORBIDDEN', 403));
    }

    const updates: Partial<ProductEntity> = { ...req.body };

    // Update availability status if stock changed
    if (updates.stock !== undefined) {
      updates.stock = Math.max(0, Number(updates.stock));
      if (!updates.availabilityStatus) {
        updates.availabilityStatus =
          updates.stock === 0 ? 'out_of_stock' : updates.stock <= 10 ? 'low_stock' : 'in_stock';
      }
    }

    if (updates.unit && !isAllowedUnit(String(updates.unit))) {
      return res.status(400).json(
        errorResponse('Use an agricultural unit such as kg, g, sack, bundle, piece, tray, or bunch', null, 'INVALID_UNIT', 400)
      );
    }

    if (updates.price !== undefined) {
      updates.price = Math.max(1, Number(updates.price));
      if (updates.price !== product.price) {
        updates.priceHistory = [
          ...(product.priceHistory || []),
          { date: new Date().toISOString().slice(0, 10), price: updates.price },
        ];
      }
    }

    const updated = db.updateProduct(req.params.id, updates);

    if (io && updated) {
      broadcastProductUpdated(io, updated);
    }

    return res.json(
      successResponse(
        { product: updated },
        'Product updated successfully in central database and synced across all devices'
      )
    );
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'PRODUCT_UPDATE_FAILED', 500));
  }
});

// @route   DELETE /api/products/:id
// @desc    Deactivate or delete product from catalog while preserving transaction history
// @access  Private (Seller of product, Admin)
router.delete('/:id', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json(errorResponse('Authentication required to delete product', null, 'UNAUTHORIZED', 401));
    }

    const product = db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json(errorResponse('Product not found', null, 'NOT_FOUND', 404));
    }

    if (!canManageProduct(user, product)) {
      return res.status(403).json(errorResponse('You can delete only your own product listings', null, 'FORBIDDEN', 403));
    }

    // Soft-delete to preserve order transaction history
    db.deleteProduct(req.params.id, false);

    if (io) {
      broadcastProductDeleted(io, req.params.id);
    }

    return res.json(
      successResponse(
        { id: req.params.id },
        'Product removed from catalog across all devices. Transaction history preserved.'
      )
    );
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'PRODUCT_DELETE_FAILED', 500));
  }
});

export default router;

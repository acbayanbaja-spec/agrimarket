import { Router, Request, Response } from 'express';
import { db, ProductEntity } from '../database/store';
import { successResponse, errorResponse } from '../utils/response';
import { io } from '../index';

const router = Router();

// @route   GET /api/products
// @desc    Get all products with filters
// @access  Public
router.get('/', (req: Request, res: Response) => {
  try {
    const { category, search, sellerId, minPrice, maxPrice } = req.query;

    let results = db.getProducts();

    if (category && category !== 'All') {
      results = results.filter((p) => p.category.toLowerCase() === String(category).toLowerCase());
    }

    if (search) {
      const q = String(search).toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.seller.toLowerCase().includes(q)
      );
    }

    if (sellerId) {
      results = results.filter((p) => p.sellerId === String(sellerId) || String(p.sellerUserId) === String(sellerId));
    }

    if (minPrice) {
      results = results.filter((p) => p.price >= Number(minPrice));
    }

    if (maxPrice) {
      results = results.filter((p) => p.price <= Number(maxPrice));
    }

    return res.json(
      successResponse(
        {
          products: results,
          total: results.length,
        },
        'Products retrieved successfully'
      )
    );
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'PRODUCTS_FETCH_FAILED', 500));
  }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', (req: Request, res: Response) => {
  try {
    const product = db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json(errorResponse('Product not found', null, 'NOT_FOUND', 404));
    }

    return res.json(successResponse({ product }, 'Product retrieved successfully'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'PRODUCT_FETCH_FAILED', 500));
  }
});

// @route   POST /api/products
// @desc    Create new product listing
// @access  Public / Authenticated
router.post('/', (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body.name || !body.price) {
      return res.status(400).json(errorResponse('Product name and price are required', null, 'BAD_REQUEST', 400));
    }

    const newProduct: ProductEntity = {
      id: body.id || `prod-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      name: body.name.trim(),
      category: body.category || 'Vegetables',
      price: Number(body.price),
      unit: body.unit || 'kg',
      stock: Number(body.stock ?? 20),
      rating: Number(body.rating ?? 5.0),
      reviews: Number(body.reviews ?? 0),
      seller: body.seller || 'SOCCSKSARGEN Farm Partner',
      sellerId: body.sellerId || `seller-${Date.now()}`,
      sellerUserId: Number(body.sellerUserId ?? 0),
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
    };

    const saved = db.addProduct(newProduct);

    // Broadcast new product to all connected shoppers
    if (io) {
      io.emit('new_product', saved);
    }

    return res.status(201).json(
      successResponse(
        { product: saved },
        'Product created and listed successfully across SOCCSKSARGEN'
      )
    );
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'PRODUCT_CREATE_FAILED', 500));
  }
});

// @route   PUT /api/products/:id
// @desc    Update product stock or details
// @access  Public / Authenticated
router.put('/:id', (req: Request, res: Response) => {
  try {
    const updated = db.updateProduct(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json(errorResponse('Product not found', null, 'NOT_FOUND', 404));
    }

    return res.json(successResponse({ product: updated }, 'Product updated successfully'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'PRODUCT_UPDATE_FAILED', 500));
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Public / Authenticated
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const ok = db.deleteProduct(req.params.id);
    if (!ok) {
      return res.status(404).json(errorResponse('Product not found', null, 'NOT_FOUND', 404));
    }

    return res.json(successResponse({ id: req.params.id }, 'Product removed from marketplace'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'PRODUCT_DELETE_FAILED', 500));
  }
});

export default router;

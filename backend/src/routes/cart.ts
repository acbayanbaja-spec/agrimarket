import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { db } from '../database/store';
import { successResponse, errorResponse } from '../utils/response';

const router = Router();

// @route   GET /api/cart
// @desc    Get user cart with hydrated product details
// @access  Private
router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const cartItems = db.getCart(user.id);

    const detailedItems = cartItems.map((item) => {
      const product = db.getProductById(item.productId);
      return {
        ...item,
        product: product || null,
      };
    });

    const subtotal = detailedItems.reduce((sum, item) => {
      const price = item.product?.price || 0;
      return sum + price * item.quantity;
    }, 0);

    return res.json(
      successResponse(
        {
          items: detailedItems,
          totalItems: detailedItems.reduce((acc, it) => acc + it.quantity, 0),
          subtotal,
        },
        'Cart retrieved successfully'
      )
    );
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'CART_FETCH_FAILED', 500));
  }
});

// @route   POST /api/cart/items
// @desc    Add item to cart
// @access  Private
router.post('/items', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { productId, quantity } = req.body;

    if (!productId) {
      return res.status(400).json(errorResponse('Product ID required', null, 'INVALID_PRODUCT', 400));
    }

    const product = db.getProductById(productId);
    if (!product) {
      return res.status(404).json(errorResponse('Product not found', null, 'NOT_FOUND', 404));
    }

    const updated = db.addToCart(user.id, productId, Number(quantity || 1));
    return res.status(201).json(successResponse(updated, 'Item added to cart'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'CART_ADD_FAILED', 500));
  }
});

// @route   PUT /api/cart/items/:id
// @desc    Update cart item quantity
// @access  Private
router.put('/items/:id', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const productId = req.params.id;
    const { quantity } = req.body;

    const updated = db.updateCartItem(user.id, productId, Number(quantity));
    return res.json(successResponse(updated, 'Cart item updated'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'CART_UPDATE_FAILED', 500));
  }
});

// @route   DELETE /api/cart/items/:id
// @desc    Remove item from cart
// @access  Private
router.delete('/items/:id', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const productId = req.params.id;

    const updated = db.removeFromCart(user.id, productId);
    return res.json(successResponse(updated, 'Item removed from cart'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'CART_REMOVE_FAILED', 500));
  }
});

// @route   DELETE /api/cart
// @desc    Clear entire cart
// @access  Private
router.delete('/', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    db.clearCart(user.id);
    return res.json(successResponse([], 'Cart cleared'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'CART_CLEAR_FAILED', 500));
  }
});

export default router;

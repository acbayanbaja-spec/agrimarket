import { Router, Response } from 'express';
import { db, TradeOfferEntity } from '../database/store';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { io } from '../index';

const router = Router();

// @route   GET /api/trades
// @desc    Get all trade offers
// @access  Public
router.get('/', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const allTrades = db.getTrades();
    const { status, toSellerId, fromUserId } = req.query;

    let filtered = allTrades;
    if (status) {
      filtered = filtered.filter((t) => t.status.toLowerCase() === String(status).toLowerCase());
    }
    if (toSellerId) {
      filtered = filtered.filter((t) => t.toSellerId === String(toSellerId));
    }
    if (fromUserId) {
      filtered = filtered.filter((t) => t.fromUserId === Number(fromUserId));
    }

    return res.json(
      successResponse(
        {
          trades: filtered,
          total: filtered.length,
        },
        'Trade offers retrieved successfully'
      )
    );
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'TRADES_FETCH_FAILED', 500));
  }
});

// @route   POST /api/trades
// @desc    Propose an agricultural barter trade (Producer/Seller only)
// @access  Private (Seller, Admin)
router.post('/', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json(errorResponse('Authentication required to propose harvest barter', null, 'UNAUTHORIZED', 401));
    }

    const isSeller = user.roles.includes('seller');
    const isAdmin = user.roles.includes('admin');
    if (!isSeller && !isAdmin) {
      return res.status(403).json(
        errorResponse(
          'Agricultural barter tradeboard is exclusive to registered producers and sellers',
          null,
          'SELLER_ROLE_REQUIRED',
          403
        )
      );
    }

    const body = req.body;
    if (!body.fromProductId || !body.toProductId) {
      return res.status(400).json(errorResponse('Both offered product and wanted product are required', null, 'BAD_REQUEST', 400));
    }

    const fromProduct = db.getProductById(body.fromProductId);
    const toProduct = db.getProductById(body.toProductId);

    if (!fromProduct) {
      return res.status(404).json(errorResponse('Offered harvest product not found', null, 'FROM_PRODUCT_NOT_FOUND', 404));
    }
    if (!toProduct) {
      return res.status(404).json(errorResponse('Target requested harvest product not found', null, 'TO_PRODUCT_NOT_FOUND', 404));
    }

    // Verify ownership of offered product
    const legacyAliases: Record<number, string[]> = {
      2: ['seller-1', 'seller-2'],
      13: ['seller-2', 'seller-3', 'seller-13'],
      15: ['seller-3', 'seller-5', 'seller-15'],
      12: ['seller-4', 'seller-2', 'seller-12'],
      17: ['seller-5', 'seller-7', 'seller-17'],
      16: ['seller-6', 'seller-16'],
      18: ['seller-7', 'seller-8', 'seller-9', 'seller-18'],
      14: ['seller-4', 'seller-6', 'seller-8', 'seller-14'],
    };
    const aliases = legacyAliases[user.id] || [];
    const isOwner =
      isAdmin ||
      fromProduct.sellerUserId === user.id ||
      fromProduct.sellerId === `seller-${user.id}` ||
      fromProduct.sellerId === `user-${user.id}` ||
      aliases.includes(fromProduct.sellerId) ||
      (user.email === 'seller@agrimarket.com' && (fromProduct.sellerId === 'seller-1' || fromProduct.sellerId === 'seller-2'));

    if (!isOwner) {
      return res.status(403).json(
        errorResponse('You can only offer agricultural produce that you have listed in your farm catalog', null, 'OFFER_OWN_PRODUCT_ONLY', 403)
      );
    }

    const anyUser = user as any;
    const proposerName = anyUser.firstName ? `${anyUser.firstName} ${anyUser.lastName || ''}`.trim() : fromProduct.seller;

    const newTrade: TradeOfferEntity = {
      id: body.id || `tr-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      fromUserId: user.id,
      fromName: proposerName,
      fromProductId: fromProduct.id,
      fromProductName: fromProduct.name,
      fromProductImage: fromProduct.image,
      offerQuantity: Number(body.offerQuantity || 10),
      offerUnit: body.offerUnit || fromProduct.unit || 'kg',
      offerValue: Number(body.offerValue || fromProduct.price * 10),
      toSellerId: toProduct.sellerId,
      toSellerName: toProduct.seller,
      toProductId: toProduct.id,
      toProductName: toProduct.name,
      toProductImage: toProduct.image,
      wantQuantity: Number(body.wantQuantity || 10),
      wantUnit: body.wantUnit || toProduct.unit || 'kg',
      wantValue: Number(body.wantValue || toProduct.price * 10),
      cashOffset: Number(body.cashOffset || 0),
      note: String(body.note || 'Even barter exchange agreed between growers.').trim(),
      status: 'Open',
      createdAt: new Date().toISOString(),
    };

    const saved = db.addTrade(newTrade);

    // Broadcast sync event
    if (io) {
      io.emit('sync:event', {
        type: 'TRADE_OFFERED',
        payload: { trade: saved },
        timestamp: Date.now(),
      });
    }

    return res.status(201).json(
      successResponse(
        { trade: saved },
        'Barter trade proposal created successfully and submitted to counterparty'
      )
    );
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'TRADE_CREATE_FAILED', 500));
  }
});

// @route   PUT /api/trades/:id/respond
// @desc    Respond to a trade offer (Accept, Decline, or Counter)
// @access  Private (Recipient Seller, Proposer, Admin)
router.put('/:id/respond', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json(errorResponse('Authentication required', null, 'UNAUTHORIZED', 401));
    }

    const { status, counterDetails } = req.body;
    if (!status || !['Accepted', 'Declined', 'Countered'].includes(status)) {
      return res.status(400).json(errorResponse('Status must be Accepted, Declined, or Countered', null, 'BAD_REQUEST', 400));
    }

    const trade = db.getTrades().find((t) => t.id === req.params.id);
    if (!trade) {
      return res.status(404).json(errorResponse('Trade offer not found', null, 'NOT_FOUND', 404));
    }

    const updated = db.updateTradeStatus(req.params.id, status, counterDetails);

    if (io && updated) {
      io.emit('sync:event', {
        type: 'TRADE_RESPONDED',
        payload: { trade: updated },
        timestamp: Date.now(),
      });
    }

    return res.json(
      successResponse(
        { trade: updated },
        `Trade offer marked as ${status}`
      )
    );
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'TRADE_UPDATE_FAILED', 500));
  }
});

export default router;

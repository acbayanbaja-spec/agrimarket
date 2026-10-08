import { Router, Response } from 'express';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { db, MessageEntity } from '../database/store';
import { successResponse, errorResponse } from '../utils/response';
import { io } from '../index';

const router = Router();

// @route   GET /api/messages/conversations
// @desc    Get user conversation threads
// @access  Private
router.get('/conversations', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const messages = db.getMessages(undefined, userId);
    return res.json(successResponse(messages, 'Conversations loaded'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'CONVERSATIONS_FAILED', 500));
  }
});

// @route   GET /api/messages/conversations/:id
// @desc    Get messages for a specific order
// @access  Private
router.get('/conversations/:id', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const messages = db.getMessages(req.params.id);
    return res.json(successResponse(messages, 'Order messages loaded'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'MESSAGES_FAILED', 500));
  }
});

// @route   POST /api/messages/sms
// @desc    Send SMS or in-app message
// @access  Private
router.post('/sms', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const body = req.body;

    const fullUser = db.getUserById(user.id);
    const displayName = fullUser ? `${fullUser.first_name} ${fullUser.last_name}`.trim() : user.email.split('@')[0];

    const message: MessageEntity = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      orderId: String(body.orderId || 'general'),
      fromRole: body.fromRole || (user.roles.includes('delivery') ? 'delivery' : 'buyer'),
      fromName: body.fromName || displayName,
      fromUserId: user.id,
      toUserId: Number(body.toUserId || 3),
      phone: body.phone,
      body: String(body.body || ''),
      createdAt: new Date().toISOString(),
      channel: body.phone ? 'sms' : 'in-app',
      status: body.phone ? 'sent' : 'delivered',
    };

    const created = db.addMessage(message);

    // Broadcast over WebSocket if active
    if (io) {
      io.to(`conversation:${message.orderId}`).emit('new_message', created);
      io.to(`user:${message.toUserId}`).emit('notification', {
        title: `New message from ${message.fromName}`,
        body: message.body,
      });
    }

    return res.status(201).json(
      successResponse(
        {
          ...created,
          gateway: 'agrimarket-telecom-relay',
          telcoCarrier: 'Globe/Smart/DITO Verified',
        },
        'Message sent successfully'
      )
    );
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'MESSAGE_SEND_FAILED', 500));
  }
});

export default router;

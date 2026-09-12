import { Router } from 'express';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { successResponse } from '../utils/response';

const router = Router();
const inbox: Array<Record<string, unknown>> = [];

router.get('/conversations', authenticate, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const conversations = inbox.filter(
    (item) => item.toUserId === userId || item.fromUserId === userId
  );
  res.json(successResponse(conversations, 'Conversations loaded'));
});

router.get('/conversations/:id', authenticate, (req: AuthRequest, res) => {
  const messages = inbox.filter((item) => String(item.orderId) === req.params.id);
  res.json(successResponse(messages, 'Conversation messages loaded'));
});

router.post('/sms', authenticate, (req: AuthRequest, res) => {
  const message = {
    ...req.body,
    fromUserId: req.body.fromUserId || req.user?.id,
    createdAt: req.body.createdAt || new Date().toISOString(),
    channel: req.body.phone ? 'sms' : 'in-app',
    status: req.body.phone ? 'sent' : 'delivered',
  };
  inbox.unshift(message);
  res.status(201).json(
    successResponse(
      {
        ...message,
        gateway: 'agrimarket-sms',
        note: 'Queued for the buyer phone. Connect Twilio or Semaphore with API keys for carrier delivery.',
      },
      'SMS queued'
    )
  );
});

export default router;

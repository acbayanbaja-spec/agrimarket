import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { config } from './config';
import { apiLimiter, authLimiter, aiLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { initSocket } from './sockets';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import orderRoutes from './routes/orders';
import cartRoutes from './routes/cart';
import deliveryRoutes from './routes/delivery';
import messageRoutes from './routes/messages';
import notificationRoutes from './routes/notifications';
import couponRoutes from './routes/coupons';
import reviewRoutes from './routes/reviews';
import sellerRoutes from './routes/sellers';
import adminRoutes from './routes/admin';
import aiRoutes from './routes/ai';
import paymentRoutes from './routes/payments';
import uploadRoutes from './routes/upload';
import wishlistRoutes from './routes/wishlist';
import analyticsRoutes from './routes/analytics';
import tradeRoutes from './routes/trades';
import path from 'path';
import { db } from './database/store';
import { isDatabaseRequired, isEmbeddedFallbackAllowed } from './config/persistence';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || config.nodeEnv !== 'production') {
      callback(null, true);
      return;
    }
    const allowed = new Set(
      [...config.corsOrigin, config.frontend.url, config.frontend.mobileUrl]
        .map((value) => String(value || '').trim())
        .filter(Boolean)
    );
    if (allowed.has('*') || allowed.has(origin)) {
      callback(null, true);
      return;
    }
    try {
      const host = new URL(origin).hostname;
      if (host.endsWith('.vercel.app') || host.endsWith('.onrender.com')) {
        callback(null, true);
        return;
      }
    } catch {
      callback(null, false);
      return;
    }
    callback(null, false);
  },
  credentials: true,
};

export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: true,
    credentials: true,
  },
});

// Initialize Socket.IO
initSocket(io);

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(compression());
app.use(cors(corsOptions));
app.use((req, res, next) => {
  const requestId =
    (req.headers['x-request-id'] as string) || `req-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`;
  res.setHeader('X-Request-Id', requestId);
  (req as express.Request & { requestId?: string }).requestId = requestId;
  next();
});
app.use(
  express.json({
    limit: '10mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/ai', aiLimiter);

// Health and platform status checks
app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    name: 'AgriMarket API',
    version: '1.0.0',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

const healthPayload = () => {
  const readiness = db.getReadiness();
  return {
    status: 'ok',
    version: '1.0.0',
    environment: config.nodeEnv,
    database: {
      connected: readiness.connected,
      required: readiness.databaseRequired,
      mode: readiness.mode,
      type: 'postgresql',
      failureKind: readiness.failureKind,
    },
    timestamp: new Date().toISOString(),
  };
};

const readyPayload = () => {
  const readiness = db.getReadiness();
  return {
    status: readiness.ready ? 'ready' : 'not_ready',
    database: {
      connected: readiness.connected,
      required: readiness.databaseRequired,
      mode: readiness.mode,
      failureKind: readiness.failureKind,
    },
    timestamp: new Date().toISOString(),
  };
};

app.get('/health', (_req, res) => {
  res.json(healthPayload());
});

app.get('/api/health', (_req, res) => {
  res.json(healthPayload());
});

app.get('/ready', (_req, res) => {
  const payload = readyPayload();
  res.status(payload.status === 'ready' ? 200 : 503).json(payload);
});

app.get('/api/ready', (_req, res) => {
  const payload = readyPayload();
  res.status(payload.status === 'ready' ? 200 : 503).json(payload);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/trades', tradeRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = config.port;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🌐 CORS origins: ${config.corsOrigin.join(', ')}`);
  if (config.nodeEnv === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key')) {
    console.error('❌ JWT_SECRET is missing or using the insecure default. Set a strong secret on Render before going live.');
  }
  console.log(
    `🗄️ Persistence: mysqlRequired=${isDatabaseRequired()} embeddedFallback=${isEmbeddedFallbackAllowed()}`
  );
  db.readyPromise.then(() => {
    const readiness = db.getReadiness();
    console.log(`🗄️ Database ready=${readiness.ready} mode=${readiness.mode}`);
  }).catch(() => {
    const readiness = db.getReadiness();
    console.error(
      `🗄️ Database not ready mode=${readiness.mode} kind=${readiness.failureKind} ${readiness.failureMessage || ''}`
    );
  });
});

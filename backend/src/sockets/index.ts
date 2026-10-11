import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { db } from '../database/store';

export const initSocket = (io: SocketIOServer) => {
  // Authentication middleware for Socket.IO - supports JWT and demo/local tokens
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      socket.data.user = { id: 0, email: 'guest@agrimarket.com', roles: ['guest'] };
      return next();
    }

    if (token.startsWith('local-') || token.startsWith('demo-')) {
      const parsedId = Number(token.split('-')[1]);
      const id = Number.isFinite(parsedId) ? parsedId : 0;
      const dbUser = db.getUserById(id);
      if (dbUser) {
        socket.data.user = {
          id: dbUser.id,
          email: dbUser.email,
          roles: dbUser.roles || ['buyer'],
        };
      } else {
        socket.data.user = { id, email: 'demo@agrimarket.com', roles: ['buyer'] };
      }
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as {
        id: number;
        email: string;
        roles: string[];
      };

      const dbUser = db.getUserById(decoded.id);
      socket.data.user = {
        id: decoded.id,
        email: decoded.email,
        roles: dbUser?.roles || decoded.roles || ['buyer'],
      };
      return next();
    } catch {
      // Allow fallback connection so guest device still receives catalog broadcasts
      socket.data.user = { id: 0, email: 'guest@agrimarket.com', roles: ['guest'] };
      return next();
    }
  });

  const setupSocketRooms = (socket: Socket) => {
    const user = socket.data.user;
    const userId = user?.id;

    // Join common rooms
    socket.join('catalog');
    socket.join('public');

    if (userId && userId > 0) {
      socket.join(`user:${userId}`);

      if (Array.isArray(user.roles)) {
        user.roles.forEach((role: string) => {
          socket.join(`role:${role}`);
        });

        if (user.roles.includes('seller')) {
          socket.join(`seller:${userId}`);
          socket.join(`seller:seller-${userId}`);
        }

        if (user.roles.includes('delivery')) {
          socket.join(`driver:${userId}`);
        }
      }
    }
  };

  io.on('connection', (socket) => {
    setupSocketRooms(socket);
    const userId = socket.data.user?.id;
    console.log(`🔌 Real-time device connected: user ${userId || 'guest'} (roles: ${(socket.data.user?.roles || []).join(', ')})`);

    // Dynamic re-auth event from client on login/switch
    socket.on('authenticate', (token: string) => {
      try {
        if (!token) return;
        if (token.startsWith('local-') || token.startsWith('demo-')) {
          const id = Number(token.split('-')[1]);
          const dbUser = db.getUserById(id);
          if (dbUser) {
            socket.data.user = { id: dbUser.id, email: dbUser.email, roles: dbUser.roles };
            setupSocketRooms(socket);
          }
          return;
        }
        const decoded = jwt.verify(token, config.jwt.secret) as any;
        const dbUser = db.getUserById(decoded.id);
        socket.data.user = {
          id: decoded.id,
          email: decoded.email,
          roles: dbUser?.roles || decoded.roles || ['buyer'],
        };
        setupSocketRooms(socket);
      } catch (err) {
        console.warn('Socket authentication update error:', err);
      }
    });

    // Handle joining conversation rooms
    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${userId} joined conversation ${conversationId}`);
    });

    // Handle leaving conversation rooms
    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Handle sending messages
    socket.on('send_message', (data: { conversationId: string; message: string; toUserId?: number }) => {
      socket.to(`conversation:${data.conversationId}`).emit('new_message', {
        conversationId: data.conversationId,
        message: data.message,
        senderId: userId,
        timestamp: new Date(),
      });
      if (data.toUserId) {
        io.to(`user:${data.toUserId}`).emit('inbox_message', {
          conversationId: data.conversationId,
          message: data.message,
          senderId: userId,
          timestamp: new Date(),
        });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('user_typing', {
        conversationId: data.conversationId,
        userId,
      });
    });

    socket.on('typing_stop', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('user_stopped_typing', {
        conversationId: data.conversationId,
        userId,
      });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Real-time device disconnected: user ${userId || 'guest'}`);
    });
  });

  return io;
};

// --- REAL-TIME BROADCAST HELPERS ---

export const broadcastProductCreated = (io: SocketIOServer, product: any) => {
  io.emit('product_created', product);
  io.emit('new_product', product);
  io.emit('catalog_changed', { action: 'created', product });
};

export const broadcastProductUpdated = (io: SocketIOServer, product: any) => {
  io.emit('product_updated', product);
  io.emit('catalog_changed', { action: 'updated', product });
};

export const broadcastProductUnlisted = (io: SocketIOServer, id: string, isUnlisted: boolean, product: any) => {
  io.emit('product_unlisted', { id, isUnlisted, product });
  io.emit('product_updated', product);
  io.emit('catalog_changed', { action: 'unlisted', id, isUnlisted, product });
};

export const broadcastProductDeleted = (io: SocketIOServer, id: string) => {
  io.emit('product_deleted', { id });
  io.emit('catalog_changed', { action: 'deleted', id });
};

export const broadcastOrderCreated = (io: SocketIOServer, order: any) => {
  // 1. Direct buyer room
  if (order.userId) {
    io.to(`user:${order.userId}`).emit('order_created', order);
    io.to(`user:${order.userId}`).emit('order_update', order);
  }

  // 2. Direct seller rooms for each distinct seller in the order
  const sellerUserIds: number[] = Array.from(new Set(order.items?.map((i: any) => Number(i.sellerUserId)).filter(Boolean) as number[]));
  sellerUserIds.forEach((sId: number) => {
    io.to(`user:${sId}`).emit('order_created', order);
    io.to(`user:${sId}`).emit('new_order', order);
    io.to(`user:${sId}`).emit('order_update', order);
  });

  // 3. Admin room
  io.to('role:admin').emit('order_created', order);
  io.to('role:admin').emit('order_update', order);

  // 4. Global broadcast so all tabs stay synced
  io.emit('order_created', order);
  io.emit('new_order', order);
};

export const broadcastOrderUpdated = (io: SocketIOServer, order: any) => {
  // 1. Direct buyer room
  if (order.userId) {
    io.to(`user:${order.userId}`).emit('order_updated', order);
    io.to(`user:${order.userId}`).emit('order_update', order);
  }

  // 2. Direct seller rooms
  const sellerUserIds: number[] = Array.from(new Set(order.items?.map((i: any) => Number(i.sellerUserId)).filter(Boolean) as number[]));
  sellerUserIds.forEach((sId: number) => {
    io.to(`user:${sId}`).emit('order_updated', order);
    io.to(`user:${sId}`).emit('order_update', order);
  });

  // 3. Delivery driver room
  if (order.driverId) {
    io.to(`user:${order.driverId}`).emit('order_updated', order);
    io.to(`user:${order.driverId}`).emit('order_update', order);
    io.to(`user:${order.driverId}`).emit('delivery_update', order);
  }

  // 4. Admin room
  io.to('role:admin').emit('order_updated', order);
  io.to('role:admin').emit('order_update', order);

  // 5. Global broadcast
  io.emit('order_updated', order);
  io.emit('order_update', order);
};

export const broadcastDeliveryUpdate = (io: SocketIOServer, driverId: number, deliveryUpdate: any) => {
  if (driverId) {
    io.to(`user:${driverId}`).emit('delivery_update', deliveryUpdate);
  }
  io.to('role:admin').emit('delivery_update', deliveryUpdate);
  io.emit('delivery_update', deliveryUpdate);
};

export const sendNotification = (io: SocketIOServer, userId: number | 'all', notification: any) => {
  if (userId === 'all') {
    io.emit('notification', notification);
  } else {
    io.to(`user:${userId}`).emit('notification', notification);
  }
};

export const sendOrderUpdate = (io: SocketIOServer, userId: number, orderUpdate: any) => {
  io.to(`user:${userId}`).emit('order_update', orderUpdate);
};

export const sendDeliveryUpdate = (io: SocketIOServer, userId: number, deliveryUpdate: any) => {
  io.to(`user:${userId}`).emit('delivery_update', deliveryUpdate);
};

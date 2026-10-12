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

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as {
        id: number;
        email: string;
        roles: string[];
      };

      const dbUser = db.getUserById(decoded.id);
      if (!dbUser || dbUser.is_active === false) {
        socket.data.user = { id: 0, email: 'guest@agrimarket.com', roles: ['guest'] };
        return next();
      }

      socket.data.user = {
        id: dbUser.id,
        email: dbUser.email,
        roles: dbUser.roles || decoded.roles || ['buyer'],
      };
      return next();
    } catch {
      // Allow fallback connection so guest device still receives public catalog broadcasts
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
        const decoded = jwt.verify(token, config.jwt.secret) as any;
        const dbUser = db.getUserById(decoded.id);
        if (dbUser && dbUser.is_active !== false) {
          socket.data.user = {
            id: decoded.id,
            email: decoded.email,
            roles: dbUser.roles || decoded.roles || ['buyer'],
          };
          setupSocketRooms(socket);
        }
      } catch (err) {
        console.warn('Socket authentication update error:', err);
      }
    });

    // Handle joining conversation rooms with authorization check
    socket.on('join_conversation', (conversationId: string) => {
      const authUser = socket.data.user;
      if (!authUser || !authUser.id) {
        return; // Unauthenticated guest cannot join private message rooms
      }

      const isAdmin = authUser.roles?.includes('admin');
      const order = db.getOrderById(conversationId);

      let isAllowed = isAdmin;
      if (order) {
        const isBuyer = order.userId === authUser.id;
        const isDriver = order.driverId === authUser.id;
        const isSeller = order.items?.some(
          (it: any) => it.sellerUserId === authUser.id || it.sellerId === `seller-${authUser.id}`
        );
        isAllowed = isAllowed || isBuyer || isDriver || isSeller;
      } else {
        // Direct non-order conversation: check if user is sender or receiver
        const msgs = db.getMessages(conversationId);
        isAllowed = isAllowed || msgs.some((m) => m.fromUserId === authUser.id || m.toUserId === authUser.id);
      }

      if (isAllowed) {
        socket.join(`conversation:${conversationId}`);
        console.log(`User ${userId} joined authorized conversation ${conversationId}`);
      } else {
        console.warn(`User ${userId} denied access to conversation ${conversationId}`);
      }
    });

    // Handle leaving conversation rooms
    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Handle sending messages with authorization verification
    socket.on('send_message', (data: { conversationId: string; message: string; toUserId?: number }) => {
      const authUser = socket.data.user;
      if (!authUser || !authUser.id || !data.conversationId || !data.message) {
        return;
      }

      // Authorize: Socket must have successfully joined this authorized conversation room
      if (!socket.rooms.has(`conversation:${data.conversationId}`)) {
        console.warn(`Unauthorized message attempt by user ${authUser.id} to conversation ${data.conversationId}`);
        return;
      }

      socket.to(`conversation:${data.conversationId}`).emit('new_message', {
        conversationId: data.conversationId,
        message: data.message,
        senderId: authUser.id,
        timestamp: new Date(),
      });
      if (data.toUserId) {
        io.to(`user:${data.toUserId}`).emit('inbox_message', {
          conversationId: data.conversationId,
          message: data.message,
          senderId: authUser.id,
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

  // 2. Direct seller rooms for each distinct seller in the order (scoped to seller's items only)
  const sellerUserIds: number[] = Array.from(
    new Set(order.items?.map((i: any) => Number(i.sellerUserId)).filter(Boolean) as number[])
  );
  sellerUserIds.forEach((sId: number) => {
    const sellerItems = (order.items || []).filter(
      (it: any) => it.sellerUserId === sId || it.sellerId === `seller-${sId}`
    );
    const sellerSubtotal = sellerItems.reduce((acc: number, it: any) => acc + (it.price * it.quantity), 0);
    const sellerScopedOrder = {
      ...order,
      items: sellerItems,
      subtotal: sellerSubtotal,
      total: sellerSubtotal,
    };
    io.to(`user:${sId}`).emit('order_created', sellerScopedOrder);
    io.to(`user:${sId}`).emit('new_order', sellerScopedOrder);
    io.to(`user:${sId}`).emit('order_update', sellerScopedOrder);
  });

  // 3. Admin room for central oversight
  io.to('role:admin').emit('order_created', order);
  io.to('role:admin').emit('order_update', order);
};

export const broadcastOrderUpdated = (io: SocketIOServer, order: any) => {
  // 1. Direct buyer room
  if (order.userId) {
    io.to(`user:${order.userId}`).emit('order_updated', order);
    io.to(`user:${order.userId}`).emit('order_update', order);
  }

  // 2. Direct seller rooms (scoped to seller's items only)
  const sellerUserIds: number[] = Array.from(
    new Set(order.items?.map((i: any) => Number(i.sellerUserId)).filter(Boolean) as number[])
  );
  sellerUserIds.forEach((sId: number) => {
    const sellerItems = (order.items || []).filter(
      (it: any) => it.sellerUserId === sId || it.sellerId === `seller-${sId}`
    );
    const sellerSubtotal = sellerItems.reduce((acc: number, it: any) => acc + (it.price * it.quantity), 0);
    const sellerScopedOrder = {
      ...order,
      items: sellerItems,
      subtotal: sellerSubtotal,
      total: sellerSubtotal,
    };
    io.to(`user:${sId}`).emit('order_updated', sellerScopedOrder);
    io.to(`user:${sId}`).emit('order_update', sellerScopedOrder);
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
};

export const broadcastDeliveryUpdate = (io: SocketIOServer, driverId: number, deliveryUpdate: any) => {
  if (driverId) {
    io.to(`user:${driverId}`).emit('delivery_update', deliveryUpdate);
  }
  // If order details exist, notify buyer and seller
  if (deliveryUpdate?.orderId) {
    const order = db.getOrderById(deliveryUpdate.orderId);
    if (order && order.userId) {
      io.to(`user:${order.userId}`).emit('delivery_update', deliveryUpdate);
    }
  }
  io.to('role:admin').emit('delivery_update', deliveryUpdate);
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

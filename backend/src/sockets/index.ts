import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export const initSocket = (io: SocketIOServer) => {
  // Authentication middleware for Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as {
        id: number;
        email: string;
        roles: string[];
      };

      socket.data.user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user?.id;
    console.log(`User ${userId} connected`);

    // Join user's personal room for notifications
    socket.join(`user:${userId}`);

    // Handle joining conversation rooms
    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${userId} joined conversation ${conversationId}`);
    });

    // Handle leaving conversation rooms
    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${userId} left conversation ${conversationId}`);
    });

    // Handle sending messages
    socket.on('send_message', (data: { conversationId: string; message: string }) => {
      // Broadcast to conversation room
      socket.to(`conversation:${data.conversationId}`).emit('new_message', {
        conversationId: data.conversationId,
        message: data.message,
        senderId: userId,
        timestamp: new Date(),
      });
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

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);
    });
  });

  return io;
};

// Helper function to send notification to a specific user
export const sendNotification = (io: SocketIOServer, userId: number, notification: any) => {
  io.to(`user:${userId}`).emit('notification', notification);
};

// Helper function to send order update
export const sendOrderUpdate = (io: SocketIOServer, userId: number, orderUpdate: any) => {
  io.to(`user:${userId}`).emit('order_update', orderUpdate);
};

// Helper function to send delivery update
export const sendDeliveryUpdate = (io: SocketIOServer, userId: number, deliveryUpdate: any) => {
  io.to(`user:${userId}`).emit('delivery_update', deliveryUpdate);
};

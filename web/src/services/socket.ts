import { io, Socket } from 'socket.io-client';
import { resolveSocketOrigin } from '../config/apiOrigin';

const SOCKET_URL = resolveSocketOrigin();

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const token = localStorage.getItem('token');
    socket = io(SOCKET_URL, {
      autoConnect: true,
      auth: {
        token: token || '',
      },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to AgriMarket real-time socket network');
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from AgriMarket socket network');
    });
  }

  return socket;
};

export const updateSocketAuth = (token: string) => {
  if (socket) {
    socket.auth = { token };
    socket.disconnect().connect();
  }
};

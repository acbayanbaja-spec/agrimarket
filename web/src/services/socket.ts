import { io, Socket } from 'socket.io-client';

const getSocketUrl = (): string => {
  const envUrl = import.meta.env.VITE_SOCKET_URL;
  if (typeof window !== 'undefined' && window.location) {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocalhost) {
      if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
        return envUrl;
      }
      return 'https://agrimarket-backend.onrender.com';
    }
  }
  return envUrl || 'http://localhost:5000';
};

const SOCKET_URL = getSocketUrl();

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

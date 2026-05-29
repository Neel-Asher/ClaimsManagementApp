import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

let socket = null;

export const socketService = {
  connect(userId) {
    try {
      socket = io(SOCKET_URL, {
        query: { userId },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      socket.on('connect_error', () => {
        console.log('Socket connection error — using mock notifications');
      });

      return socket;
    } catch (err) {
      console.log('Socket unavailable — mock mode active');
      return null;
    }
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  on(event, callback) {
    if (socket) {
      socket.on(event, callback);
    }
  },

  off(event, callback) {
    if (socket) {
      socket.off(event, callback);
    }
  },

  emit(event, data) {
    if (socket) {
      socket.emit(event, data);
    }
  },

  getSocket() {
    return socket;
  }
};

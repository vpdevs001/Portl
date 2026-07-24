import { io, type Socket } from 'socket.io-client';
import { authClient } from './auth-client';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

let socket: Socket | null = null;

/**
 * Lazily creates (or returns) a single shared Socket.IO connection for live
 * poll updates. React Native's WebSocket transport can't attach custom
 * headers the way a browser's XHR/polling transport can, so the session
 * cookie Better Auth already stores (via `@better-auth/expo`'s SecureStore
 * adapter) is sent inside the handshake `auth` payload instead — the server
 * (server/src/lib/socket.ts) reads it from there.
 */
export function getPollsSocket(): Socket {
  if (socket) return socket;

  socket = io(API_BASE_URL, {
    transports: ['websocket'],
    autoConnect: false,
    auth: (cb) => {
      cb({ cookie: authClient.getCookie() });
    }
  });

  return socket;
}

export function disconnectPollsSocket() {
  socket?.disconnect();
  socket = null;
}

import { io } from 'socket.io-client';
import { BASE_URL } from './api';

let socket;
export function getSocket() {
  if (!socket) {
    socket = io(BASE_URL, { transports: ['websocket'] });
  }
  return socket;
}
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// utils/socket.js
import { io } from 'socket.io-client';

let socket;

export function connectTaskerSocket({ baseUrl, taskerId, region, onNewTask, onTaskUpdate }) {
  if (socket && socket.connected) return socket;

  socket = io(baseUrl, {
    transports: ['websocket'],
    query: { taskerId: String(taskerId || ''), region: String(region || '') }
  });

  socket.on('connect', () => {
    // console.log('socket connected');
  });

  socket.on('tasks:new', (task) => {
    onNewTask?.(task);
  });

  socket.on('tasks:update', (task) => {
    onTaskUpdate?.(task);
  });

  return socket;
}

export function setOnlineSocket(online) {
  socket?.emit('tasker:setOnline', { online });
}

export function disconnectTaskerSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

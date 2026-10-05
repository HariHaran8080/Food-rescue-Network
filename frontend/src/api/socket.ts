import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_BASE_URL, { autoConnect: true });
    const token = localStorage.getItem('token');
    if (token) socket.emit('auth', token);
  }
  return socket;
}

export function reauthSocket() {
  const token = localStorage.getItem('token');
  if (socket && token) socket.emit('auth', token);
}

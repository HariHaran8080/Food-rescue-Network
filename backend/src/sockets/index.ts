import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';

let io: Server | null = null;

export function initSockets(httpServer: HttpServer, clientUrl: string) {
  io = new Server(httpServer, {
    cors: { origin: clientUrl, credentials: true },
  });

  io.on('connection', (socket: Socket) => {
    // Client sends its JWT after connecting so we can put it in a personal room
    // e.g. socket.emit('auth', token)
    socket.on('auth', (token: string) => {
      try {
        const payload = verifyToken(token);
        socket.join(`user:${payload.userId}`);
      } catch {
        // ignore invalid token, socket just won't get personal notifications
      }
    });

    socket.on('disconnect', () => {});
  });

  return io;
}

export function getIO() {
  return io;
}

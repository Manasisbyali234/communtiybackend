import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/index';
import { JwtPayload } from '../types/index';
import { logger } from '../config/logger';

/**
 * Socket.io authentication middleware.
 * Expects { auth: { token: '<accessToken>' } } on the handshake.
 */
export function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void): void {
  const token = socket.handshake.auth?.['token'] as string | undefined;

  if (!token) {
    logger.warn({ socketId: socket.id }, 'Socket handshake missing token');
    return next(new Error('Unauthorized'));
  }

  try {
    const payload = jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtPayload;
    socket.data['userId'] = payload.sub;
    socket.data['role'] = payload.role;
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
}

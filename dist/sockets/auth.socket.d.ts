import { Socket } from 'socket.io';
/**
 * Socket.io authentication middleware.
 * Expects { auth: { token: '<accessToken>' } } on the handshake.
 */
export declare function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void): void;
//# sourceMappingURL=auth.socket.d.ts.map
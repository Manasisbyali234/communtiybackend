import { Server, Socket } from 'socket.io';
export declare function registerPresenceHandlers(io: Server, socket: Socket): void;
export declare function isUserOnline(userId: string): Promise<boolean>;
//# sourceMappingURL=presence.socket.d.ts.map
import { Server, Socket } from 'socket.io';
export type UserPresence = {
    isOnline: boolean;
    lastSeenAt: string | null;
};
export declare function registerPresenceHandlers(io: Server, socket: Socket): void;
export declare function isUserOnline(userId: string): Promise<boolean>;
export declare function getUserPresence(userId: string): Promise<UserPresence>;
//# sourceMappingURL=presence.socket.d.ts.map
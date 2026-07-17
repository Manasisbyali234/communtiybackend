"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocketServer = initSocketServer;
exports.getIO = getIO;
const socket_io_1 = require("socket.io");
const index_1 = require("../config/index");
const logger_1 = require("../config/logger");
const auth_socket_1 = require("./auth.socket");
const chat_socket_1 = require("./chat.socket");
const presence_socket_1 = require("./presence.socket");
let io;
function initSocketServer(httpServer) {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: index_1.config.CORS_ORIGINS.split(',').map((o) => o.trim()),
            methods: ['GET', 'POST'],
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    });
    // Auth middleware on every connection
    io.use(auth_socket_1.socketAuthMiddleware);
    io.on('connection', (socket) => {
        const userId = socket.data['userId'];
        logger_1.logger.info({ userId, socketId: socket.id }, 'Socket connected');
        // Join personal user room for targeted events (notifications, presence)
        void socket.join(`user:${userId}`);
        // Register domain-specific handlers
        (0, chat_socket_1.registerChatHandlers)(io, socket);
        (0, presence_socket_1.registerPresenceHandlers)(io, socket);
        socket.on('disconnect', (reason) => {
            logger_1.logger.info({ userId, reason }, 'Socket disconnected');
        });
        socket.on('error', (err) => {
            logger_1.logger.error({ err, userId }, 'Socket error');
        });
    });
    logger_1.logger.info('Socket.io server initialized');
    return io;
}
function getIO() {
    if (!io)
        throw new Error('Socket.io has not been initialized. Call initSocketServer first.');
    return io;
}
//# sourceMappingURL=index.js.map
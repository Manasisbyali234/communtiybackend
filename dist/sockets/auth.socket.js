"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketAuthMiddleware = socketAuthMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../config/index");
const logger_1 = require("../config/logger");
/**
 * Socket.io authentication middleware.
 * Expects { auth: { token: '<accessToken>' } } on the handshake.
 */
function socketAuthMiddleware(socket, next) {
    const token = socket.handshake.auth?.['token'];
    if (!token) {
        logger_1.logger.warn({ socketId: socket.id }, 'Socket handshake missing token');
        return next(new Error('Unauthorized'));
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, index_1.config.JWT_ACCESS_SECRET);
        socket.data['userId'] = payload.sub;
        socket.data['role'] = payload.role;
        next();
    }
    catch {
        next(new Error('Unauthorized'));
    }
}
//# sourceMappingURL=auth.socket.js.map
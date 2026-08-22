"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuth = adminAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const ApiError_1 = require("../utils/ApiError");
const logger_1 = require("../config/logger");
const config_1 = require("../config");
async function adminAuth(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return next(ApiError_1.ApiError.unauthorized('Missing admin token'));
    }
    const token = authHeader.slice(7);
    try {
        const session = await database_1.prisma.adminSession.findUnique({
            where: { token },
        });
        if (session && session.expiresAt >= new Date()) {
            req.adminId = session.adminId;
            return next();
        }
        if (session?.expiresAt < new Date()) {
            logger_1.logger.warn({ url: req.originalUrl, expiresAt: session.expiresAt }, 'Admin session has expired');
        }
        // Native clients already hold the normal user JWT. Accept it only when it
        // belongs to an active administrator, avoiding a second token race.
        const payload = jsonwebtoken_1.default.verify(token, config_1.config.JWT_ACCESS_SECRET);
        if (payload.role !== 'ADMIN')
            return next(ApiError_1.ApiError.forbidden('Administrator access required'));
        const admin = await database_1.prisma.user.findFirst({
            where: { id: payload.sub, role: 'ADMIN', isActive: true, isBanned: false, deletedAt: null },
            select: { id: true },
        });
        if (!admin)
            return next(ApiError_1.ApiError.forbidden('Administrator access required'));
        req.adminId = admin.id;
        next();
    }
    catch (error) {
        logger_1.logger.error({ error, url: req.originalUrl }, 'Admin session validation failed');
        next(ApiError_1.ApiError.unauthorized('Admin auth failed'));
    }
}
//# sourceMappingURL=adminAuth.js.map
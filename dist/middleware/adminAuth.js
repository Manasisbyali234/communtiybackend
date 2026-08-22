"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuth = adminAuth;
const database_1 = require("../config/database");
const ApiError_1 = require("../utils/ApiError");
const logger_1 = require("../config/logger");
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
        if (!session) {
            logger_1.logger.warn({ url: req.originalUrl }, 'Admin session token was not found');
            return next(ApiError_1.ApiError.unauthorized('Invalid or expired admin session'));
        }
        if (session.expiresAt < new Date()) {
            logger_1.logger.warn({ url: req.originalUrl, expiresAt: session.expiresAt }, 'Admin session has expired');
            return next(ApiError_1.ApiError.unauthorized('Invalid or expired admin session'));
        }
        // Attach adminId to request for downstream use
        req.adminId = session.adminId;
        next();
    }
    catch (error) {
        logger_1.logger.error({ error, url: req.originalUrl }, 'Admin session validation failed');
        next(ApiError_1.ApiError.unauthorized('Admin auth failed'));
    }
}
//# sourceMappingURL=adminAuth.js.map
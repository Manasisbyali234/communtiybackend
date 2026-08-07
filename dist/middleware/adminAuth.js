"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuth = adminAuth;
const database_1 = require("../config/database");
const ApiError_1 = require("../utils/ApiError");
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
        if (!session || session.expiresAt < new Date()) {
            return next(ApiError_1.ApiError.unauthorized('Invalid or expired admin session'));
        }
        // Attach adminId to request for downstream use
        req.adminId = session.adminId;
        next();
    }
    catch {
        next(ApiError_1.ApiError.unauthorized('Admin auth failed'));
    }
}
//# sourceMappingURL=adminAuth.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../../config/database");
const asyncHandler_1 = require("../../utils/asyncHandler");
const ApiResponse_1 = require("../../utils/ApiResponse");
const ApiError_1 = require("../../utils/ApiError");
const adminAuth_1 = require("../../middleware/adminAuth");
const router = (0, express_1.Router)();
// POST /api/v1/admin-auth/login
router.post('/login', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        throw ApiError_1.ApiError.badRequest('Email and password required');
    const admin = await database_1.prisma.user.findFirst({
        where: { email, role: 'ADMIN', deletedAt: null, isBanned: false },
        select: { id: true, email: true, username: true, displayName: true, avatarUrl: true, passwordHash: true, role: true },
    });
    if (!admin || !admin.passwordHash)
        throw ApiError_1.ApiError.unauthorized('Invalid admin credentials');
    const valid = await bcryptjs_1.default.compare(password, admin.passwordHash);
    if (!valid)
        throw ApiError_1.ApiError.unauthorized('Invalid admin credentials');
    const token = crypto_1.default.randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    await database_1.prisma.adminSession.create({ data: { adminId: admin.id, token, expiresAt } });
    const { passwordHash: _, ...adminData } = admin;
    res.json(new ApiResponse_1.ApiResponse(200, { token, expiresAt, admin: adminData }, 'Admin login successful'));
}));
// POST /api/v1/admin-auth/logout
router.post('/logout', adminAuth_1.adminAuth, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const token = req.headers.authorization.slice(7);
    await database_1.prisma.adminSession.deleteMany({ where: { token } });
    res.json(new ApiResponse_1.ApiResponse(200, null, 'Logged out'));
}));
// GET /api/v1/admin-auth/me
router.get('/me', adminAuth_1.adminAuth, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const adminId = req.adminId;
    const admin = await database_1.prisma.user.findUnique({
        where: { id: adminId },
        select: { id: true, email: true, username: true, displayName: true, avatarUrl: true, role: true },
    });
    if (!admin)
        throw ApiError_1.ApiError.notFound('Admin not found');
    res.json(new ApiResponse_1.ApiResponse(200, admin));
}));
exports.default = router;
//# sourceMappingURL=admin-auth.routes.js.map
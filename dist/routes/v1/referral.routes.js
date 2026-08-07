"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../../middleware/auth");
const adminAuth_1 = require("../../middleware/adminAuth");
const validate_1 = require("../../middleware/validate");
const asyncHandler_1 = require("../../utils/asyncHandler");
const ApiResponse_1 = require("../../utils/ApiResponse");
const database_1 = require("../../config/database");
const router = (0, express_1.Router)();
const ShareSchema = zod_1.z.object({
    sharedWith: zod_1.z.string().max(100).optional(),
    sharedEmail: zod_1.z.string().email().optional(),
});
// POST /referral/share — called when user taps Share Profile
router.post('/share', auth_1.auth, (0, validate_1.validate)({ body: ShareSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { sharedWith, sharedEmail } = req.body;
    await database_1.prisma.profileShare.create({
        data: { sharerId: req.user.id, sharedWith, sharedEmail },
    });
    const count = await database_1.prisma.profileShare.count({ where: { sharerId: req.user.id } });
    res.json(new ApiResponse_1.ApiResponse(200, { shareCount: count }, 'Share tracked'));
}));
// GET /referral/my-shares — share count + list for the current user
router.get('/my-shares', auth_1.auth, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const [shares, referrals] = await Promise.all([
        database_1.prisma.profileShare.findMany({
            where: { sharerId: req.user.id },
            orderBy: { createdAt: 'desc' },
            select: { id: true, sharedWith: true, sharedEmail: true, createdAt: true },
        }),
        database_1.prisma.user.findMany({
            where: { referredById: req.user.id },
            select: { id: true, displayName: true, email: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
        }),
    ]);
    res.json(new ApiResponse_1.ApiResponse(200, { shareCount: shares.length, shares, referrals }));
}));
// ── Admin endpoints ───────────────────────────────────────────────────────────
// GET /referral/admin/all — all shares across all users
router.get('/admin/all', adminAuth_1.adminAuth, (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const shares = await database_1.prisma.profileShare.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            sharer: { select: { id: true, displayName: true, email: true } },
        },
    });
    res.json(new ApiResponse_1.ApiResponse(200, shares));
}));
// GET /referral/admin/referrals — users who registered via a referral link
router.get('/admin/referrals', adminAuth_1.adminAuth, (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const referred = await database_1.prisma.user.findMany({
        where: { referredById: { not: null } },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            displayName: true,
            email: true,
            createdAt: true,
            referredBy: { select: { id: true, displayName: true, email: true } },
        },
    });
    res.json(new ApiResponse_1.ApiResponse(200, referred));
}));
exports.default = router;
//# sourceMappingURL=referral.routes.js.map
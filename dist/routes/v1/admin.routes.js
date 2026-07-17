"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const audit_1 = require("../../middleware/audit");
const asyncHandler_1 = require("../../utils/asyncHandler");
const ApiResponse_1 = require("../../utils/ApiResponse");
const ApiError_1 = require("../../utils/ApiError");
const database_1 = require("../../config/database");
const validate_1 = require("../../middleware/validate");
const pagination_1 = require("../../utils/pagination");
const router = (0, express_1.Router)();
router.use(auth_1.auth, (0, rbac_1.rbac)('ADMIN'));
const BanSchema = zod_1.z.object({
    reason: zod_1.z.string().min(1).max(500),
    banExpiresAt: zod_1.z.coerce.date().optional().nullable(),
});
const PaginationSchema = zod_1.z.object({
    skip: zod_1.z.coerce.number().default(0),
    take: zod_1.z.coerce.number().max(100).default(20),
    status: zod_1.z.string().optional(),
    role: zod_1.z.string().optional(),
    isActive: zod_1.z.coerce.boolean().optional(),
    isBanned: zod_1.z.coerce.boolean().optional(),
    q: zod_1.z.string().optional(),
});
const CursorQuerySchema = zod_1.z.object({
    cursor: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
});
// ── Dashboard Stats ───────────────────────────────────────────────────────────
router.get('/stats', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const [users, posts, communities, events, reports, pendingReports] = await Promise.all([
        database_1.prisma.user.count({ where: { deletedAt: null } }),
        database_1.prisma.post.count({ where: { deletedAt: null } }),
        database_1.prisma.community.count(),
        database_1.prisma.event.count(),
        database_1.prisma.report.count(),
        database_1.prisma.report.count({ where: { status: 'PENDING' } }),
    ]);
    res.json(new ApiResponse_1.ApiResponse(200, { users, posts, communities, events, reports, pendingReports }));
}));
// ── Analytics: Daily Active Users (last 30 days) ──────────────────────────────
router.get('/analytics/dau', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const days = await database_1.prisma.dailyStats.findMany({
        orderBy: { date: 'desc' },
        take: 30,
        select: { date: true, activeUsers: true, newUsers: true, newPosts: true },
    });
    res.json(new ApiResponse_1.ApiResponse(200, days));
}));
// ── Analytics: Growth (new users per day, last 30 days) ──────────────────────
router.get('/analytics/growth', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const result = await database_1.prisma.$queryRaw `
      SELECT DATE_TRUNC('day', "createdAt") as date, COUNT(*) as count
      FROM "User"
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
        AND "deletedAt" IS NULL
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date DESC
    `;
    res.json(new ApiResponse_1.ApiResponse(200, result));
}));
// ── Analytics: Post volume per day ────────────────────────────────────────────
router.get('/analytics/posts', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const result = await database_1.prisma.$queryRaw `
      SELECT DATE_TRUNC('day', "createdAt") as date, COUNT(*) as count
      FROM "Post"
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
        AND "deletedAt" IS NULL
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date DESC
    `;
    res.json(new ApiResponse_1.ApiResponse(200, result));
}));
// ── User management ───────────────────────────────────────────────────────────
router.get('/users', (0, validate_1.validate)({ query: PaginationSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { skip, take, role, isActive, isBanned, q } = req.query;
    const users = await database_1.prisma.user.findMany({
        skip: skip ? parseInt(skip) : 0,
        take: take ? parseInt(take) : 20,
        where: {
            deletedAt: null,
            ...(role ? { role: role } : {}),
            ...(isActive !== undefined ? { isActive: isActive === 'true' } : {}),
            ...(isBanned !== undefined ? { isBanned: isBanned === 'true' } : {}),
            ...(q ? { OR: [{ username: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }, { displayName: { contains: q, mode: 'insensitive' } }] } : {}),
        },
        select: {
            id: true, email: true, username: true, displayName: true,
            role: true, isActive: true, isVerified: true, isBanned: true,
            banReason: true, banExpiresAt: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
    });
    res.json(new ApiResponse_1.ApiResponse(200, users));
}));
router.put('/users/:id/role', (0, audit_1.audit)('UPDATE_ROLE', 'User'), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { role } = req.body;
    const user = await database_1.prisma.user.update({
        where: { id: req.params['id'] },
        data: { role: role },
        select: { id: true, username: true, role: true },
    });
    res.json(new ApiResponse_1.ApiResponse(200, user, 'Role updated'));
}));
router.put('/users/:id/ban', (0, validate_1.validate)({ body: BanSchema }), (0, audit_1.audit)('BAN_USER', 'User'), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { reason, banExpiresAt } = req.body;
    const user = await database_1.prisma.user.update({
        where: { id: req.params['id'] },
        data: { isBanned: true, banReason: reason, banExpiresAt: banExpiresAt ?? null, isActive: false },
        select: { id: true, username: true, isBanned: true, banReason: true, banExpiresAt: true },
    });
    await database_1.prisma.refreshToken.deleteMany({ where: { userId: req.params['id'] } });
    res.json(new ApiResponse_1.ApiResponse(200, user, 'User banned'));
}));
router.put('/users/:id/unban', (0, audit_1.audit)('UNBAN_USER', 'User'), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = await database_1.prisma.user.update({
        where: { id: req.params['id'] },
        data: { isBanned: false, banReason: null, banExpiresAt: null, isActive: true },
        select: { id: true, username: true, isBanned: true },
    });
    res.json(new ApiResponse_1.ApiResponse(200, user, 'User unbanned'));
}));
// ── Content moderation ────────────────────────────────────────────────────────
router.get('/reports', (0, validate_1.validate)({ query: PaginationSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { skip, take, status } = req.query;
    const reports = await database_1.prisma.report.findMany({
        skip: skip ? parseInt(skip) : 0,
        take: take ? parseInt(take) : 20,
        where: { ...(status ? { status: status } : {}) },
        include: {
            reporter: { select: { id: true, username: true } },
            reportedUser: { select: { id: true, username: true } },
            post: { select: { id: true, content: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
    res.json(new ApiResponse_1.ApiResponse(200, reports));
}));
router.put('/reports/:id', (0, audit_1.audit)('UPDATE_REPORT', 'Report'), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { status, resolution } = req.body;
    const report = await database_1.prisma.report.update({
        where: { id: req.params['id'] },
        data: {
            status: status,
            reviewedAt: new Date(),
            reviewedBy: req.user.id,
            ...(resolution ? { resolution } : {}),
        },
    });
    res.json(new ApiResponse_1.ApiResponse(200, report, 'Report updated'));
}));
router.delete('/posts/:id', (0, audit_1.audit)('REMOVE_POST', 'Post'), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const post = await database_1.prisma.post.findUnique({ where: { id: req.params['id'] } });
    if (!post)
        throw ApiError_1.ApiError.notFound('Post not found');
    await database_1.prisma.post.update({ where: { id: req.params['id'] }, data: { deletedAt: new Date() } });
    res.json(new ApiResponse_1.ApiResponse(200, null, 'Post removed'));
}));
// ── Audit logs ────────────────────────────────────────────────────────────────
router.get('/audit-logs', (0, validate_1.validate)({ query: CursorQuerySchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { cursor, limit } = req.query;
    const args = (0, pagination_1.buildCursorArgs)({ cursor, limit: limit ? parseInt(limit) : 20 });
    const logs = await database_1.prisma.auditLog.findMany({
        ...args,
        include: { actor: { select: { id: true, username: true } } },
        orderBy: { createdAt: 'desc' },
    });
    res.json(new ApiResponse_1.ApiResponse(200, (0, pagination_1.buildCursorPage)(logs, limit ? parseInt(limit) : 20)));
}));
exports.default = router;
//# sourceMappingURL=admin.routes.js.map
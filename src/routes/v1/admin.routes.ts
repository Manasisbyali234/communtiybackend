import { Router } from 'express';
import { z } from 'zod';
import { auth } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import { audit } from '../../middleware/audit';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { prisma } from '../../config/database';
import { validate } from '../../middleware/validate';
import { buildCursorArgs, buildCursorPage } from '../../utils/pagination';

const router = Router();
router.use(auth, rbac('ADMIN'));

const BanSchema = z.object({
  reason: z.string().min(1).max(500),
  banExpiresAt: z.coerce.date().optional().nullable(),
});

const PaginationSchema = z.object({
  skip: z.coerce.number().default(0),
  take: z.coerce.number().max(100).default(20),
  status: z.string().optional(),
  role: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  isBanned: z.coerce.boolean().optional(),
  q: z.string().optional(),
});

const CursorQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// ── Dashboard Stats ───────────────────────────────────────────────────────────
router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const [users, posts, communities, events, reports, pendingReports] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.post.count({ where: { deletedAt: null } }),
      prisma.community.count(),
      prisma.event.count(),
      prisma.report.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
    ]);
    res.json(new ApiResponse(200, { users, posts, communities, events, reports, pendingReports }));
  }),
);

// ── Analytics: Daily Active Users (last 30 days) ──────────────────────────────
router.get(
  '/analytics/dau',
  asyncHandler(async (_req, res) => {
    const days = await prisma.dailyStats.findMany({
      orderBy: { date: 'desc' },
      take: 30,
      select: { date: true, activeUsers: true, newUsers: true, newPosts: true },
    });
    res.json(new ApiResponse(200, days));
  }),
);

// ── Analytics: Growth (new users per day, last 30 days) ──────────────────────
router.get(
  '/analytics/growth',
  asyncHandler(async (_req, res) => {
    const result = await prisma.$queryRaw<{ date: string; count: number }[]>`
      SELECT DATE_TRUNC('day', "createdAt") as date, COUNT(*) as count
      FROM "User"
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
        AND "deletedAt" IS NULL
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date DESC
    `;
    res.json(new ApiResponse(200, result));
  }),
);

// ── Analytics: Post volume per day ────────────────────────────────────────────
router.get(
  '/analytics/posts',
  asyncHandler(async (_req, res) => {
    const result = await prisma.$queryRaw<{ date: string; count: number }[]>`
      SELECT DATE_TRUNC('day', "createdAt") as date, COUNT(*) as count
      FROM "Post"
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
        AND "deletedAt" IS NULL
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date DESC
    `;
    res.json(new ApiResponse(200, result));
  }),
);

// ── User management ───────────────────────────────────────────────────────────
router.get(
  '/users',
  validate({ query: PaginationSchema }),
  asyncHandler(async (req, res) => {
    const { skip, take, role, isActive, isBanned, q } = req.query as {
      skip?: string; take?: string; role?: string;
      isActive?: string; isBanned?: string; q?: string;
    };
    const users = await prisma.user.findMany({
      skip: skip ? parseInt(skip) : 0,
      take: take ? parseInt(take) : 20,
      where: {
        deletedAt: null,
        ...(role ? { role: role as 'USER' | 'MODERATOR' | 'ADMIN' } : {}),
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
    res.json(new ApiResponse(200, users));
  }),
);

router.put(
  '/users/:id/role',
  audit('UPDATE_ROLE', 'User'),
  asyncHandler(async (req, res) => {
    const { role } = req.body as { role: string };
    const user = await prisma.user.update({
      where: { id: req.params['id'] },
      data: { role: role as 'USER' | 'MODERATOR' | 'ADMIN' },
      select: { id: true, username: true, role: true },
    });
    res.json(new ApiResponse(200, user, 'Role updated'));
  }),
);

router.put(
  '/users/:id/ban',
  validate({ body: BanSchema }),
  audit('BAN_USER', 'User'),
  asyncHandler(async (req, res) => {
    const { reason, banExpiresAt } = req.body as { reason: string; banExpiresAt?: Date };
    const user = await prisma.user.update({
      where: { id: req.params['id'] },
      data: { isBanned: true, banReason: reason, banExpiresAt: banExpiresAt ?? null, isActive: false },
      select: { id: true, username: true, isBanned: true, banReason: true, banExpiresAt: true },
    });
    await prisma.refreshToken.deleteMany({ where: { userId: req.params['id'] } });
    res.json(new ApiResponse(200, user, 'User banned'));
  }),
);

router.put(
  '/users/:id/unban',
  audit('UNBAN_USER', 'User'),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.update({
      where: { id: req.params['id'] },
      data: { isBanned: false, banReason: null, banExpiresAt: null, isActive: true },
      select: { id: true, username: true, isBanned: true },
    });
    res.json(new ApiResponse(200, user, 'User unbanned'));
  }),
);

// ── Content moderation ────────────────────────────────────────────────────────
router.get(
  '/reports',
  validate({ query: PaginationSchema }),
  asyncHandler(async (req, res) => {
    const { skip, take, status } = req.query as { skip?: string; take?: string; status?: string };
    const reports = await prisma.report.findMany({
      skip: skip ? parseInt(skip) : 0,
      take: take ? parseInt(take) : 20,
      where: { ...(status ? { status: status as 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED' } : {}) },
      include: {
        reporter: { select: { id: true, username: true } },
        reportedUser: { select: { id: true, username: true } },
        post: { select: { id: true, content: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(new ApiResponse(200, reports));
  }),
);

router.put(
  '/reports/:id',
  audit('UPDATE_REPORT', 'Report'),
  asyncHandler(async (req, res) => {
    const { status, resolution } = req.body as { status: string; resolution?: string };
    const report = await prisma.report.update({
      where: { id: req.params['id'] },
      data: {
        status: status as 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED',
        reviewedAt: new Date(),
        reviewedBy: req.user.id,
        ...(resolution ? { resolution } : {}),
      },
    });
    res.json(new ApiResponse(200, report, 'Report updated'));
  }),
);

router.delete(
  '/posts/:id',
  audit('REMOVE_POST', 'Post'),
  asyncHandler(async (req, res) => {
    const post = await prisma.post.findUnique({ where: { id: req.params['id'] } });
    if (!post) throw ApiError.notFound('Post not found');
    await prisma.post.update({ where: { id: req.params['id'] }, data: { deletedAt: new Date() } });
    res.json(new ApiResponse(200, null, 'Post removed'));
  }),
);

// ── Audit logs ────────────────────────────────────────────────────────────────
router.get(
  '/audit-logs',
  validate({ query: CursorQuerySchema }),
  asyncHandler(async (req, res) => {
    const { cursor, limit } = req.query as { cursor?: string; limit?: string };
    const args = buildCursorArgs({ cursor, limit: limit ? parseInt(limit) : 20 });
    const logs = await prisma.auditLog.findMany({
      ...args,
      include: { actor: { select: { id: true, username: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(new ApiResponse(200, buildCursorPage(logs, limit ? parseInt(limit) : 20)));
  }),
);

export default router;

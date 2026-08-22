import { Router } from 'express';
import crypto from 'crypto';
import { prisma } from '../../config/database';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { adminAuth } from '../../middleware/adminAuth';
import { auth } from '../../middleware/auth';
import { authService } from '../../services/auth.service';

const router = Router();

// POST /api/v1/admin-auth/session
// Exchange an already verified admin access token for an admin-panel session.
router.post(
  '/session',
  auth,
  asyncHandler(async (req, res) => {
    const admin = await prisma.user.findFirst({
      where: { id: req.user.id, role: 'ADMIN', deletedAt: null, isBanned: false, isActive: true },
      select: { id: true, email: true, username: true, displayName: true, avatarUrl: true, role: true },
    });
    if (!admin) throw ApiError.forbidden('Administrator access required');

    const token = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.adminSession.create({ data: { adminId: admin.id, token, expiresAt } });

    res.json(new ApiResponse(200, { token, expiresAt, admin }, 'Admin session created'));
  }),
);

// POST /api/v1/admin-auth/login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) throw ApiError.badRequest('Email and password required');

    // Keep this legacy endpoint aligned with the main login flow, including
    // password verification and account-status checks.
    const { user: admin } = await authService.login(email, password);
    if (admin.role !== 'ADMIN') throw ApiError.unauthorized('Invalid admin credentials');

    const token = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await prisma.adminSession.create({ data: { adminId: admin.id, token, expiresAt } });

    res.json(new ApiResponse(200, { token, expiresAt, admin }, 'Admin login successful'));
  }),
);

// POST /api/v1/admin-auth/logout
router.post(
  '/logout',
  adminAuth,
  asyncHandler(async (req, res) => {
    const token = req.headers.authorization!.slice(7);
    await prisma.adminSession.deleteMany({ where: { token } });
    res.json(new ApiResponse(200, null, 'Logged out'));
  }),
);

// GET /api/v1/admin-auth/me
router.get(
  '/me',
  adminAuth,
  asyncHandler(async (req, res) => {
    const adminId = (req as any).adminId as string;
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { id: true, email: true, username: true, displayName: true, avatarUrl: true, role: true },
    });
    if (!admin) throw ApiError.notFound('Admin not found');
    res.json(new ApiResponse(200, admin));
  }),
);

export default router;

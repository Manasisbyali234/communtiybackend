import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { adminAuth } from '../../middleware/adminAuth';

const router = Router();

// POST /api/v1/admin-auth/login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) throw ApiError.badRequest('Email and password required');

    const admin = await prisma.user.findFirst({
      where: { email, role: 'ADMIN', deletedAt: null, isBanned: false },
      select: { id: true, email: true, username: true, displayName: true, avatarUrl: true, passwordHash: true, role: true },
    });
    if (!admin || !admin.passwordHash) throw ApiError.unauthorized('Invalid admin credentials');

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) throw ApiError.unauthorized('Invalid admin credentials');

    const token = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await prisma.adminSession.create({ data: { adminId: admin.id, token, expiresAt } });

    const { passwordHash: _, ...adminData } = admin;
    res.json(new ApiResponse(200, { token, expiresAt, admin: adminData }, 'Admin login successful'));
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

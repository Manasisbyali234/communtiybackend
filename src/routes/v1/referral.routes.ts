import { Router } from 'express';
import { z } from 'zod';
import { auth } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { prisma } from '../../config/database';

const router = Router();

const ShareSchema = z.object({
  sharedWith: z.string().max(100).optional(),
  sharedEmail: z.string().email().optional(),
});

// POST /referral/share — called when user taps Share Profile
router.post(
  '/share',
  auth,
  validate({ body: ShareSchema }),
  asyncHandler(async (req, res) => {
    const { sharedWith, sharedEmail } = req.body as { sharedWith?: string; sharedEmail?: string };
    await prisma.profileShare.create({
      data: { sharerId: req.user.id, sharedWith, sharedEmail },
    });
    const count = await prisma.profileShare.count({ where: { sharerId: req.user.id } });
    res.json(new ApiResponse(200, { shareCount: count }, 'Share tracked'));
  }),
);

// GET /referral/my-shares — share count + list for the current user
router.get(
  '/my-shares',
  auth,
  asyncHandler(async (req, res) => {
    const [shares, referrals] = await Promise.all([
      prisma.profileShare.findMany({
        where: { sharerId: req.user.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, sharedWith: true, sharedEmail: true, createdAt: true },
      }),
      prisma.user.findMany({
        where: { referredById: req.user.id },
        select: { id: true, displayName: true, email: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    res.json(new ApiResponse(200, { shareCount: shares.length, shares, referrals }));
  }),
);

// ── Admin endpoints ───────────────────────────────────────────────────────────

// GET /referral/admin/all — all shares across all users
router.get(
  '/admin/all',
  auth,
  rbac('ADMIN'),
  asyncHandler(async (_req, res) => {
    const shares = await prisma.profileShare.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        sharer: { select: { id: true, displayName: true, email: true } },
      },
    });
    res.json(new ApiResponse(200, shares));
  }),
);

// GET /referral/admin/referrals — users who registered via a referral link
router.get(
  '/admin/referrals',
  auth,
  rbac('ADMIN'),
  asyncHandler(async (_req, res) => {
    const referred = await prisma.user.findMany({
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
    res.json(new ApiResponse(200, referred));
  }),
);

export default router;

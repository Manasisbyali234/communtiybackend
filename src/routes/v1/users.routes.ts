import { Router } from 'express';
import { z } from 'zod';
import { usersController } from '../../controllers/users.controller';
import { auth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

const router = Router();

const UpdateMeSchema = z.object({
  displayName: z.string().min(1).max(60).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  coverImage: z.string().url().nullable().optional(),
  village: z.string().max(50).optional(),
  occupation: z.string().max(50).optional(),
  languages: z.string().max(100).optional(),
  interests: z.string().max(100).optional(),
});

const CursorQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

const PushTokenSchema = z.object({ expoPushToken: z.string().min(1) });

const DeviceTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['ios', 'android', 'web']),
});

const SettingsSchema = z.object({
  isPrivateAccount: z.boolean().optional(),
  whoCanMessage: z.enum(['PUBLIC', 'FOLLOWERS', 'PRIVATE']).optional(),
  whoCanSeeFollowers: z.enum(['PUBLIC', 'FOLLOWERS', 'PRIVATE']).optional(),
  notifyLikes: z.boolean().optional(),
  notifyComments: z.boolean().optional(),
  notifyFollows: z.boolean().optional(),
  notifyMessages: z.boolean().optional(),
  notifyStoryViews: z.boolean().optional(),
  notifyEvents: z.boolean().optional(),
});

router.use(auth);

// ── My profile ────────────────────────────────────────────────────────────────
router.get('/me', usersController.getMe);
router.put('/me', validate({ body: UpdateMeSchema }), usersController.updateMe);
router.delete('/me', usersController.deleteMe);

// ── Settings ──────────────────────────────────────────────────────────────────
router.get('/me/settings', usersController.getSettings);
router.put('/me/settings', validate({ body: SettingsSchema }), usersController.updateSettings);

// ── Bookmarks ─────────────────────────────────────────────────────────────────
router.get('/me/bookmarks', validate({ query: CursorQuerySchema }), usersController.getBookmarks);

// ── Device tokens ─────────────────────────────────────────────────────────────
router.get('/me/device-tokens', usersController.listDeviceTokens);
router.post('/me/device-tokens', validate({ body: DeviceTokenSchema }), usersController.registerDeviceToken);
router.delete('/me/device-tokens/:tokenId', usersController.unregisterDeviceToken);

// Legacy single push token (keep for backwards compat)
router.put('/me/push-token', validate({ body: PushTokenSchema }), usersController.updatePushToken);

// ── Block ─────────────────────────────────────────────────────────────────────
router.get('/me/blocked', validate({ query: CursorQuerySchema }), usersController.getBlocked);
router.post('/:id/block', usersController.blockUser);
router.delete('/:id/block', usersController.unblockUser);

// ── Social ────────────────────────────────────────────────────────────────────
router.get('/:id', usersController.getUser);
router.post('/:id/follow', usersController.follow);
router.delete('/:id/follow', usersController.unfollow);
router.get('/:id/followers', validate({ query: CursorQuerySchema }), usersController.getFollowers);
router.get('/:id/following', validate({ query: CursorQuerySchema }), usersController.getFollowing);
router.get('/:id/posts', validate({ query: CursorQuerySchema }), usersController.getUserPosts);

export default router;

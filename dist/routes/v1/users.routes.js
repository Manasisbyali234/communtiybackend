"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const users_controller_1 = require("../../controllers/users.controller");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const router = (0, express_1.Router)();
const UpdateMeSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(1).max(60).optional(),
    bio: zod_1.z.string().max(500).optional(),
    avatarUrl: zod_1.z.string().url().optional(),
    bannerUrl: zod_1.z.string().url().optional(),
});
const CursorQuerySchema = zod_1.z.object({
    cursor: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
});
const PushTokenSchema = zod_1.z.object({ expoPushToken: zod_1.z.string().min(1) });
const DeviceTokenSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
    platform: zod_1.z.enum(['ios', 'android', 'web']),
});
const SettingsSchema = zod_1.z.object({
    isPrivateAccount: zod_1.z.boolean().optional(),
    whoCanMessage: zod_1.z.enum(['PUBLIC', 'FOLLOWERS', 'PRIVATE']).optional(),
    whoCanSeeFollowers: zod_1.z.enum(['PUBLIC', 'FOLLOWERS', 'PRIVATE']).optional(),
    notifyLikes: zod_1.z.boolean().optional(),
    notifyComments: zod_1.z.boolean().optional(),
    notifyFollows: zod_1.z.boolean().optional(),
    notifyMessages: zod_1.z.boolean().optional(),
    notifyStoryViews: zod_1.z.boolean().optional(),
    notifyEvents: zod_1.z.boolean().optional(),
});
router.use(auth_1.auth);
// ── My profile ────────────────────────────────────────────────────────────────
router.get('/me', users_controller_1.usersController.getMe);
router.put('/me', (0, validate_1.validate)({ body: UpdateMeSchema }), users_controller_1.usersController.updateMe);
router.delete('/me', users_controller_1.usersController.deleteMe);
// ── Settings ──────────────────────────────────────────────────────────────────
router.get('/me/settings', users_controller_1.usersController.getSettings);
router.put('/me/settings', (0, validate_1.validate)({ body: SettingsSchema }), users_controller_1.usersController.updateSettings);
// ── Bookmarks ─────────────────────────────────────────────────────────────────
router.get('/me/bookmarks', (0, validate_1.validate)({ query: CursorQuerySchema }), users_controller_1.usersController.getBookmarks);
// ── Device tokens ─────────────────────────────────────────────────────────────
router.get('/me/device-tokens', users_controller_1.usersController.listDeviceTokens);
router.post('/me/device-tokens', (0, validate_1.validate)({ body: DeviceTokenSchema }), users_controller_1.usersController.registerDeviceToken);
router.delete('/me/device-tokens/:tokenId', users_controller_1.usersController.unregisterDeviceToken);
// Legacy single push token (keep for backwards compat)
router.put('/me/push-token', (0, validate_1.validate)({ body: PushTokenSchema }), users_controller_1.usersController.updatePushToken);
// ── Block ─────────────────────────────────────────────────────────────────────
router.get('/me/blocked', (0, validate_1.validate)({ query: CursorQuerySchema }), users_controller_1.usersController.getBlocked);
router.post('/:id/block', users_controller_1.usersController.blockUser);
router.delete('/:id/block', users_controller_1.usersController.unblockUser);
// ── Social ────────────────────────────────────────────────────────────────────
router.get('/:id', users_controller_1.usersController.getUser);
router.post('/:id/follow', users_controller_1.usersController.follow);
router.delete('/:id/follow', users_controller_1.usersController.unfollow);
router.get('/:id/followers', (0, validate_1.validate)({ query: CursorQuerySchema }), users_controller_1.usersController.getFollowers);
router.get('/:id/following', (0, validate_1.validate)({ query: CursorQuerySchema }), users_controller_1.usersController.getFollowing);
router.get('/:id/posts', (0, validate_1.validate)({ query: CursorQuerySchema }), users_controller_1.usersController.getUserPosts);
exports.default = router;
//# sourceMappingURL=users.routes.js.map
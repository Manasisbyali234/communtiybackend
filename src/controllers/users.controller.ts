import { Request, Response } from 'express';
import { usersService } from '../services/users.service';
import { blocksService } from '../services/blocks.service';
import { settingsService } from '../services/settings.service';
import { bookmarksService } from '../services/bookmarks.service';
import { deviceTokensService } from '../services/deviceTokens.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const usersController = {
  getMe: asyncHandler(async (req: Request, res: Response) => {
    const user = await usersService.getMe(req.user.id);
    res.json(new ApiResponse(200, user));
  }),

  updateMe: asyncHandler(async (req: Request, res: Response) => {
    const user = await usersService.updateMe(req.user.id, req.body as { displayName?: string; bio?: string; avatarUrl?: string; bannerUrl?: string; coverImage?: string | null; village?: string; occupation?: string; languages?: string; interests?: string });
    res.json(new ApiResponse(200, user, 'Profile updated'));
  }),

  deleteMe: asyncHandler(async (req: Request, res: Response) => {
    await usersService.deactivateMe(req.user.id);
    res.json(new ApiResponse(200, null, 'Account deactivated'));
  }),

  updatePushToken: asyncHandler(async (req: Request, res: Response) => {
    const { expoPushToken } = req.body as { expoPushToken: string };
    await usersService.updatePushToken(req.user.id, expoPushToken);
    res.json(new ApiResponse(200, null, 'Push token updated'));
  }),

  // Settings
  getSettings: asyncHandler(async (req: Request, res: Response) => {
    const settings = await settingsService.getSettings(req.user.id);
    res.json(new ApiResponse(200, settings));
  }),

  updateSettings: asyncHandler(async (req: Request, res: Response) => {
    const settings = await settingsService.updateSettings(req.user.id, req.body);
    res.json(new ApiResponse(200, settings, 'Settings updated'));
  }),

  // Bookmarks
  getBookmarks: asyncHandler(async (req: Request, res: Response) => {
    const { cursor, limit } = req.query as { cursor?: string; limit?: string };
    const result = await bookmarksService.getBookmarks(req.user.id, cursor, limit ? parseInt(limit) : 20);
    res.json(new ApiResponse(200, result));
  }),

  // Device tokens
  listDeviceTokens: asyncHandler(async (req: Request, res: Response) => {
    const tokens = await deviceTokensService.listDevices(req.user.id);
    res.json(new ApiResponse(200, tokens));
  }),

  registerDeviceToken: asyncHandler(async (req: Request, res: Response) => {
    const { token, platform } = req.body as { token: string; platform: 'ios' | 'android' | 'web' };
    const dt = await deviceTokensService.register(req.user.id, token, platform);
    res.status(201).json(new ApiResponse(201, dt, 'Device registered'));
  }),

  unregisterDeviceToken: asyncHandler(async (req: Request, res: Response) => {
    await deviceTokensService.unregister(req.user.id, req.params['tokenId']);
    res.json(new ApiResponse(200, null, 'Device unregistered'));
  }),

  // Blocks
  blockUser: asyncHandler(async (req: Request, res: Response) => {
    await blocksService.blockUser(req.user.id, req.params['id']);
    res.json(new ApiResponse(200, null, 'User blocked'));
  }),

  unblockUser: asyncHandler(async (req: Request, res: Response) => {
    await blocksService.unblockUser(req.user.id, req.params['id']);
    res.json(new ApiResponse(200, null, 'User unblocked'));
  }),

  getBlocked: asyncHandler(async (req: Request, res: Response) => {
    const { cursor, limit } = req.query as { cursor?: string; limit?: string };
    const result = await blocksService.getBlockedUsers(req.user.id, cursor, limit ? parseInt(limit) : 20);
    res.json(new ApiResponse(200, result));
  }),

  // Public profile
  getUser: asyncHandler(async (req: Request, res: Response) => {
    const user = await usersService.getPublicProfile(req.params['id'], req.user.id);
    res.json(new ApiResponse(200, user));
  }),

  follow: asyncHandler(async (req: Request, res: Response) => {
    await usersService.followUser(req.user.id, req.params['id']);
    res.json(new ApiResponse(200, null, 'Following'));
  }),

  unfollow: asyncHandler(async (req: Request, res: Response) => {
    await usersService.unfollowUser(req.user.id, req.params['id']);
    res.json(new ApiResponse(200, null, 'Unfollowed'));
  }),

  getFollowers: asyncHandler(async (req: Request, res: Response) => {
    const { cursor, limit } = req.query as { cursor?: string; limit?: string };
    const result = await usersService.getFollowers(req.params['id'], cursor, limit ? parseInt(limit) : 20);
    res.json(new ApiResponse(200, result));
  }),

  getFollowing: asyncHandler(async (req: Request, res: Response) => {
    const { cursor, limit } = req.query as { cursor?: string; limit?: string };
    const result = await usersService.getFollowing(req.params['id'], cursor, limit ? parseInt(limit) : 20);
    res.json(new ApiResponse(200, result));
  }),

  getUserPosts: asyncHandler(async (req: Request, res: Response) => {
    const { cursor, limit } = req.query as { cursor?: string; limit?: string };
    const result = await usersService.getUserPosts(req.params['id'], cursor, limit ? parseInt(limit) : 20);
    res.json(new ApiResponse(200, result));
  }),
};

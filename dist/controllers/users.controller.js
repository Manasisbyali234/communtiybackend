"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersController = void 0;
const users_service_1 = require("../services/users.service");
const blocks_service_1 = require("../services/blocks.service");
const settings_service_1 = require("../services/settings.service");
const bookmarks_service_1 = require("../services/bookmarks.service");
const deviceTokens_service_1 = require("../services/deviceTokens.service");
const ApiResponse_1 = require("../utils/ApiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.usersController = {
    getMe: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const user = await users_service_1.usersService.getMe(req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, user));
    }),
    updateMe: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const user = await users_service_1.usersService.updateMe(req.user.id, req.body);
        res.json(new ApiResponse_1.ApiResponse(200, user, 'Profile updated'));
    }),
    deleteMe: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await users_service_1.usersService.deactivateMe(req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Account deactivated'));
    }),
    updatePushToken: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { expoPushToken } = req.body;
        await users_service_1.usersService.updatePushToken(req.user.id, expoPushToken);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Push token updated'));
    }),
    // Settings
    getSettings: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const settings = await settings_service_1.settingsService.getSettings(req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, settings));
    }),
    updateSettings: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const settings = await settings_service_1.settingsService.updateSettings(req.user.id, req.body);
        res.json(new ApiResponse_1.ApiResponse(200, settings, 'Settings updated'));
    }),
    // Bookmarks
    getBookmarks: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { cursor, limit } = req.query;
        const result = await bookmarks_service_1.bookmarksService.getBookmarks(req.user.id, cursor, limit ? parseInt(limit) : 20);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    // Device tokens
    listDeviceTokens: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const tokens = await deviceTokens_service_1.deviceTokensService.listDevices(req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, tokens));
    }),
    registerDeviceToken: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { token, platform } = req.body;
        const dt = await deviceTokens_service_1.deviceTokensService.register(req.user.id, token, platform);
        res.status(201).json(new ApiResponse_1.ApiResponse(201, dt, 'Device registered'));
    }),
    unregisterDeviceToken: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await deviceTokens_service_1.deviceTokensService.unregister(req.user.id, req.params['tokenId']);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Device unregistered'));
    }),
    // Blocks
    blockUser: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await blocks_service_1.blocksService.blockUser(req.user.id, req.params['id']);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'User blocked'));
    }),
    unblockUser: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await blocks_service_1.blocksService.unblockUser(req.user.id, req.params['id']);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'User unblocked'));
    }),
    getBlocked: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { cursor, limit } = req.query;
        const result = await blocks_service_1.blocksService.getBlockedUsers(req.user.id, cursor, limit ? parseInt(limit) : 20);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    // Public profile
    getUser: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const user = await users_service_1.usersService.getPublicProfile(req.params['id'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, user));
    }),
    follow: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await users_service_1.usersService.followUser(req.user.id, req.params['id']);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Following'));
    }),
    unfollow: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await users_service_1.usersService.unfollowUser(req.user.id, req.params['id']);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Unfollowed'));
    }),
    getFollowers: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { cursor, limit } = req.query;
        const result = await users_service_1.usersService.getFollowers(req.params['id'], cursor, limit ? parseInt(limit) : 20);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    getFollowing: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { cursor, limit } = req.query;
        const result = await users_service_1.usersService.getFollowing(req.params['id'], cursor, limit ? parseInt(limit) : 20);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    getUserPosts: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { cursor, limit } = req.query;
        const result = await users_service_1.usersService.getUserPosts(req.params['id'], cursor, limit ? parseInt(limit) : 20);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
};
//# sourceMappingURL=users.controller.js.map
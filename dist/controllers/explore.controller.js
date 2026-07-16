"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exploreController = void 0;
const explore_service_1 = require("../services/explore.service");
const ApiResponse_1 = require("../utils/ApiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.exploreController = {
    getTrendingPosts: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { limit } = req.query;
        const result = await explore_service_1.exploreService.getTrendingPosts(req.user.id, limit ? parseInt(limit) : 20);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    getTrendingCommunities: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { limit } = req.query;
        const result = await explore_service_1.exploreService.getTrendingCommunities(limit ? parseInt(limit) : 10);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    getTrendingHashtags: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { limit } = req.query;
        const result = await explore_service_1.exploreService.getTrendingHashtags(limit ? parseInt(limit) : 20);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    getSuggestedUsers: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { limit } = req.query;
        const result = await explore_service_1.exploreService.getSuggestedUsers(req.user.id, limit ? parseInt(limit) : 10);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    getSuggestedCommunities: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { limit } = req.query;
        const result = await explore_service_1.exploreService.getSuggestedCommunities(req.user.id, limit ? parseInt(limit) : 10);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    getPostsByHashtag: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { cursor, limit } = req.query;
        const result = await explore_service_1.exploreService.getPostsByHashtag(req.params['name'], req.user.id, cursor, limit ? parseInt(limit) : 20);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
};
//# sourceMappingURL=explore.controller.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchController = void 0;
const search_service_1 = require("../services/search.service");
const ApiResponse_1 = require("../utils/ApiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.searchController = {
    search: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { q, limit } = req.query;
        const result = await search_service_1.searchService.search(q, req.user.id, limit ? parseInt(limit) : 10);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    searchUsers: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { q, limit } = req.query;
        const result = await search_service_1.searchService.searchUsers(q, req.user.id, limit ? parseInt(limit) : 20);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    searchPosts: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { q, limit } = req.query;
        const result = await search_service_1.searchService.searchPosts(q, req.user.id, limit ? parseInt(limit) : 20);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    searchCommunities: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { q, limit } = req.query;
        const result = await search_service_1.searchService.searchCommunities(q, limit ? parseInt(limit) : 20);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    searchEvents: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { q, limit } = req.query;
        const result = await search_service_1.searchService.searchEvents(q, limit ? parseInt(limit) : 20);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    searchHashtags: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { q, limit } = req.query;
        const result = await search_service_1.searchService.searchHashtags(q, limit ? parseInt(limit) : 20);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
};
//# sourceMappingURL=search.controller.js.map
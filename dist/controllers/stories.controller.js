"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storiesController = void 0;
const stories_service_1 = require("../services/stories.service");
const ApiResponse_1 = require("../utils/ApiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.storiesController = {
    getFeed: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await stories_service_1.storiesService.getFeed(req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    createStory: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { mediaUrl, mediaType } = req.body;
        const story = await stories_service_1.storiesService.create(req.user.id, mediaUrl, mediaType);
        res.status(201).json(new ApiResponse_1.ApiResponse(201, story, 'Story created'));
    }),
    deleteStory: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await stories_service_1.storiesService.delete(req.params['id'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Story deleted'));
    }),
    viewStory: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await stories_service_1.storiesService.recordView(req.params['id'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'View recorded'));
    }),
    getViewers: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const viewers = await stories_service_1.storiesService.getViewers(req.params['id'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, viewers));
    }),
    likeStory: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await stories_service_1.storiesService.likeStory(req.params['id'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Story liked'));
    }),
    unlikeStory: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await stories_service_1.storiesService.unlikeStory(req.params['id'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Story unliked'));
    }),
    replyToStory: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { content } = req.body;
        const reply = await stories_service_1.storiesService.replyToStory(req.params['id'], req.user.id, content);
        res.status(201).json(new ApiResponse_1.ApiResponse(201, reply, 'Reply sent'));
    }),
    getStoryReplies: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const replies = await stories_service_1.storiesService.getStoryReplies(req.params['id'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, replies));
    }),
};
//# sourceMappingURL=stories.controller.js.map
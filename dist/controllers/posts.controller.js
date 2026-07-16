"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postsController = void 0;
const posts_service_1 = require("../services/posts.service");
const comments_service_1 = require("../services/comments.service");
const bookmarks_service_1 = require("../services/bookmarks.service");
const ApiResponse_1 = require("../utils/ApiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.postsController = {
    getFeed: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { cursor, limit } = req.query;
        const result = await posts_service_1.postsService.getFeed(req.user.id, cursor, limit ? parseInt(limit) : 20);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    getTrending: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { cursor, limit } = req.query;
        const result = await posts_service_1.postsService.getTrendingPosts(req.user.id, cursor, limit ? parseInt(limit) : 20);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    getDrafts: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { cursor, limit } = req.query;
        const result = await posts_service_1.postsService.getDrafts(req.user.id, cursor, limit ? parseInt(limit) : 20);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    createPost: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const post = await posts_service_1.postsService.createPost(req.user.id, req.body);
        res.status(201).json(new ApiResponse_1.ApiResponse(201, post, 'Post created'));
    }),
    getPost: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const post = await posts_service_1.postsService.getPost(req.params['id'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, post));
    }),
    updatePost: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const post = await posts_service_1.postsService.updatePost(req.params['id'], req.user.id, req.body);
        res.json(new ApiResponse_1.ApiResponse(200, post, 'Post updated'));
    }),
    deletePost: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await posts_service_1.postsService.deletePost(req.params['id'], req.user.id, req.user.role);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Post deleted'));
    }),
    publishDraft: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const post = await posts_service_1.postsService.publishDraft(req.params['id'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, post, 'Draft published'));
    }),
    likePost: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await posts_service_1.postsService.likePost(req.params['id'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Post liked'));
    }),
    unlikePost: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await posts_service_1.postsService.unlikePost(req.params['id'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Post unliked'));
    }),
    bookmarkPost: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await bookmarks_service_1.bookmarksService.addBookmark(req.user.id, req.params['id']);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Post bookmarked'));
    }),
    unbookmarkPost: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await bookmarks_service_1.bookmarksService.removeBookmark(req.user.id, req.params['id']);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Bookmark removed'));
    }),
    getComments: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { cursor, limit, parentId } = req.query;
        const result = await comments_service_1.commentsService.getComments(req.params['id'], parentId ?? null, cursor, limit ? parseInt(limit) : 20);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    addComment: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { content, parentId } = req.body;
        const comment = await comments_service_1.commentsService.addComment(req.params['id'], req.user.id, content, parentId);
        res.status(201).json(new ApiResponse_1.ApiResponse(201, comment, 'Comment added'));
    }),
    updateComment: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { content } = req.body;
        const comment = await comments_service_1.commentsService.updateComment(req.params['cid'], req.user.id, content);
        res.json(new ApiResponse_1.ApiResponse(200, comment, 'Comment updated'));
    }),
    deleteComment: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await comments_service_1.commentsService.deleteComment(req.params['cid'], req.params['id'], req.user.id, req.user.role);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Comment deleted'));
    }),
    likeComment: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await comments_service_1.commentsService.likeComment(req.params['cid'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Comment liked'));
    }),
};
//# sourceMappingURL=posts.controller.js.map
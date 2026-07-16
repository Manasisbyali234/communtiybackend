"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const posts_controller_1 = require("../../controllers/posts.controller");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const router = (0, express_1.Router)();
const CreatePostSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(5000),
    mediaUrls: zod_1.z.array(zod_1.z.string().url()).max(10).optional(),
    communityId: zod_1.z.string().cuid().optional(),
    isDraft: zod_1.z.boolean().optional(),
    scheduledAt: zod_1.z.coerce.date().optional().nullable(),
});
const UpdatePostSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(5000).optional(),
    isDraft: zod_1.z.boolean().optional(),
});
const AddCommentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(2000),
    parentId: zod_1.z.string().cuid().optional(),
});
const UpdateCommentSchema = zod_1.z.object({ content: zod_1.z.string().min(1).max(2000) });
const CursorQuerySchema = zod_1.z.object({
    cursor: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
    parentId: zod_1.z.string().cuid().nullable().optional(),
});
router.use(auth_1.auth);
// ── Feed & Explore ────────────────────────────────────────────────────────────
router.get('/feed', (0, validate_1.validate)({ query: CursorQuerySchema }), posts_controller_1.postsController.getFeed);
router.get('/trending', (0, validate_1.validate)({ query: CursorQuerySchema }), posts_controller_1.postsController.getTrending);
router.get('/drafts', (0, validate_1.validate)({ query: CursorQuerySchema }), posts_controller_1.postsController.getDrafts);
// ── CRUD ──────────────────────────────────────────────────────────────────────
router.post('/', (0, validate_1.validate)({ body: CreatePostSchema }), posts_controller_1.postsController.createPost);
router.get('/:id', posts_controller_1.postsController.getPost);
router.put('/:id', (0, validate_1.validate)({ body: UpdatePostSchema }), posts_controller_1.postsController.updatePost);
router.delete('/:id', posts_controller_1.postsController.deletePost);
router.post('/:id/publish', posts_controller_1.postsController.publishDraft);
// ── Social ────────────────────────────────────────────────────────────────────
router.post('/:id/like', posts_controller_1.postsController.likePost);
router.delete('/:id/like', posts_controller_1.postsController.unlikePost);
router.post('/:id/bookmark', posts_controller_1.postsController.bookmarkPost);
router.delete('/:id/bookmark', posts_controller_1.postsController.unbookmarkPost);
// ── Comments ──────────────────────────────────────────────────────────────────
router.get('/:id/comments', (0, validate_1.validate)({ query: CursorQuerySchema }), posts_controller_1.postsController.getComments);
router.post('/:id/comments', (0, validate_1.validate)({ body: AddCommentSchema }), posts_controller_1.postsController.addComment);
router.put('/:id/comments/:cid', (0, validate_1.validate)({ body: UpdateCommentSchema }), posts_controller_1.postsController.updateComment);
router.delete('/:id/comments/:cid', posts_controller_1.postsController.deleteComment);
router.post('/:id/comments/:cid/like', posts_controller_1.postsController.likeComment);
exports.default = router;
//# sourceMappingURL=posts.routes.js.map
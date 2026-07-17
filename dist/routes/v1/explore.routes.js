"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const explore_controller_1 = require("../../controllers/explore.controller");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const router = (0, express_1.Router)();
router.use(auth_1.auth);
const LimitSchema = zod_1.z.object({ limit: zod_1.z.coerce.number().min(1).max(50).default(20) });
const HashtagSchema = zod_1.z.object({ cursor: zod_1.z.string().optional(), limit: zod_1.z.coerce.number().min(1).max(50).default(20) });
router.get('/trending-posts', (0, validate_1.validate)({ query: LimitSchema }), explore_controller_1.exploreController.getTrendingPosts);
router.get('/trending-communities', (0, validate_1.validate)({ query: LimitSchema }), explore_controller_1.exploreController.getTrendingCommunities);
router.get('/trending-hashtags', (0, validate_1.validate)({ query: LimitSchema }), explore_controller_1.exploreController.getTrendingHashtags);
router.get('/suggested-users', (0, validate_1.validate)({ query: LimitSchema }), explore_controller_1.exploreController.getSuggestedUsers);
router.get('/suggested-communities', (0, validate_1.validate)({ query: LimitSchema }), explore_controller_1.exploreController.getSuggestedCommunities);
router.get('/hashtag/:name', (0, validate_1.validate)({ query: HashtagSchema }), explore_controller_1.exploreController.getPostsByHashtag);
exports.default = router;
//# sourceMappingURL=explore.routes.js.map
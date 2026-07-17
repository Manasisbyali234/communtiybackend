"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const search_controller_1 = require("../../controllers/search.controller");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const router = (0, express_1.Router)();
router.use(auth_1.auth);
const SearchSchema = zod_1.z.object({
    q: zod_1.z.string().min(1).max(100),
    limit: zod_1.z.coerce.number().min(1).max(50).default(10),
    type: zod_1.z.enum(['all', 'users', 'posts', 'communities', 'events', 'hashtags']).default('all'),
});
router.get('/', (0, validate_1.validate)({ query: SearchSchema }), search_controller_1.searchController.search);
router.get('/users', (0, validate_1.validate)({ query: SearchSchema }), search_controller_1.searchController.searchUsers);
router.get('/posts', (0, validate_1.validate)({ query: SearchSchema }), search_controller_1.searchController.searchPosts);
router.get('/communities', (0, validate_1.validate)({ query: SearchSchema }), search_controller_1.searchController.searchCommunities);
router.get('/events', (0, validate_1.validate)({ query: SearchSchema }), search_controller_1.searchController.searchEvents);
router.get('/hashtags', (0, validate_1.validate)({ query: SearchSchema }), search_controller_1.searchController.searchHashtags);
exports.default = router;
//# sourceMappingURL=search.routes.js.map
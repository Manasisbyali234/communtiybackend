"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const stories_controller_1 = require("../../controllers/stories.controller");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const router = (0, express_1.Router)();
const CreateStorySchema = zod_1.z.object({
    mediaUrl: zod_1.z.string().url(),
    mediaType: zod_1.z.enum(['IMAGE', 'VIDEO']),
});
const ReplySchema = zod_1.z.object({ content: zod_1.z.string().min(1).max(500) });
router.use(auth_1.auth);
router.get('/feed', stories_controller_1.storiesController.getFeed);
router.post('/', (0, validate_1.validate)({ body: CreateStorySchema }), stories_controller_1.storiesController.createStory);
router.delete('/:id', stories_controller_1.storiesController.deleteStory);
router.post('/:id/view', stories_controller_1.storiesController.viewStory);
router.get('/:id/viewers', stories_controller_1.storiesController.getViewers);
router.post('/:id/like', stories_controller_1.storiesController.likeStory);
router.delete('/:id/like', stories_controller_1.storiesController.unlikeStory);
router.post('/:id/reply', (0, validate_1.validate)({ body: ReplySchema }), stories_controller_1.storiesController.replyToStory);
router.get('/:id/replies', stories_controller_1.storiesController.getStoryReplies);
exports.default = router;
//# sourceMappingURL=stories.routes.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const messages_controller_1 = require("../../controllers/messages.controller");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const router = (0, express_1.Router)();
router.use(auth_1.auth);
const StartConversationSchema = zod_1.z.object({ participantId: zod_1.z.string().cuid() });
const SendMessageSchema = zod_1.z.object({
    content: zod_1.z.string().max(5000).optional(),
    mediaUrl: zod_1.z.string().url().optional(),
    mediaType: zod_1.z.enum(['IMAGE', 'VIDEO', 'AUDIO']).optional(),
}).refine((d) => d.content ?? d.mediaUrl, { message: 'Either content or mediaUrl is required' });
const CursorQuerySchema = zod_1.z.object({
    cursor: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().min(1).max(100).default(30),
});
const ReactionSchema = zod_1.z.object({ emoji: zod_1.z.string().min(1).max(10) });
router.get('/conversations', messages_controller_1.messagesController.getConversations);
router.post('/conversations', (0, validate_1.validate)({ body: StartConversationSchema }), messages_controller_1.messagesController.getOrCreate);
router.get('/conversations/:id', (0, validate_1.validate)({ query: CursorQuerySchema }), messages_controller_1.messagesController.getMessages);
router.post('/conversations/:id', (0, validate_1.validate)({ body: SendMessageSchema }), messages_controller_1.messagesController.sendMessage);
router.put('/conversations/:id/read', messages_controller_1.messagesController.markRead);
// Message actions
router.post('/messages/:msgId/reactions', (0, validate_1.validate)({ body: ReactionSchema }), messages_controller_1.messagesController.addReaction);
router.delete('/messages/:msgId/reactions/:emoji', messages_controller_1.messagesController.removeReaction);
router.delete('/messages/:msgId/everyone', messages_controller_1.messagesController.deleteForEveryone);
router.delete('/messages/:msgId/me', messages_controller_1.messagesController.deleteForMe);
exports.default = router;
//# sourceMappingURL=messages.routes.js.map
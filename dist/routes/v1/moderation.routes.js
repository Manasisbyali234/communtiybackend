"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const moderation_controller_1 = require("../../controllers/moderation.controller");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const validate_1 = require("../../middleware/validate");
const router = (0, express_1.Router)();
router.use(auth_1.auth);
const ReportSchema = zod_1.z.object({
    postId: zod_1.z.string().cuid().optional(),
    reportedUserId: zod_1.z.string().cuid().optional(),
    reason: zod_1.z.enum(['SPAM', 'HARASSMENT', 'HATE_SPEECH', 'MISINFORMATION', 'NUDITY', 'VIOLENCE', 'OTHER']),
    details: zod_1.z.string().max(1000).optional(),
});
const UpdateReportSchema = zod_1.z.object({
    status: zod_1.z.enum(['REVIEWED', 'RESOLVED', 'DISMISSED']),
});
// Any authenticated user can submit reports
router.post('/reports', (0, validate_1.validate)({ body: ReportSchema }), moderation_controller_1.moderationController.submitReport);
// Moderator/Admin only
router.get('/reports', (0, rbac_1.rbac)('ADMIN', 'MODERATOR'), moderation_controller_1.moderationController.listReports);
router.put('/reports/:id', (0, rbac_1.rbac)('ADMIN', 'MODERATOR'), (0, validate_1.validate)({ body: UpdateReportSchema }), moderation_controller_1.moderationController.updateReport);
router.post('/posts/:id/remove', (0, rbac_1.rbac)('ADMIN', 'MODERATOR'), moderation_controller_1.moderationController.removePost);
// Admin only
router.post('/users/:id/ban', (0, rbac_1.rbac)('ADMIN'), moderation_controller_1.moderationController.banUser);
router.delete('/users/:id/ban', (0, rbac_1.rbac)('ADMIN'), moderation_controller_1.moderationController.unbanUser);
exports.default = router;
//# sourceMappingURL=moderation.routes.js.map
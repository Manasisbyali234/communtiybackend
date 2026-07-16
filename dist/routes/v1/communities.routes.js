"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const communities_controller_1 = require("../../controllers/communities.controller");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const router = (0, express_1.Router)();
const CreateCommunitySchema = zod_1.z.object({
    name: zod_1.z.string().min(3).max(80),
    description: zod_1.z.string().max(500).optional(),
    category: zod_1.z.string().min(1),
    isPrivate: zod_1.z.boolean().default(false),
    avatarUrl: zod_1.z.string().url().optional(),
    bannerUrl: zod_1.z.string().url().optional(),
});
const UpdateCommunitySchema = CreateCommunitySchema.partial();
const UpdateRoleSchema = zod_1.z.object({
    role: zod_1.z.enum(['MEMBER', 'MODERATOR', 'ADMIN']),
});
const CursorQuerySchema = zod_1.z.object({
    cursor: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
    category: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    sort: zod_1.z.enum(['popular', 'newest']).optional(),
});
const RuleSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(500).optional(),
    order: zod_1.z.number().optional(),
});
const InviteSchema = zod_1.z.object({ userId: zod_1.z.string().cuid() });
router.use(auth_1.auth);
// ── CRUD ──────────────────────────────────────────────────────────────────────
router.get('/', (0, validate_1.validate)({ query: CursorQuerySchema }), communities_controller_1.communitiesController.list);
router.post('/', (0, validate_1.validate)({ body: CreateCommunitySchema }), communities_controller_1.communitiesController.create);
router.get('/invites', communities_controller_1.communitiesController.getMyInvites);
router.get('/:id', communities_controller_1.communitiesController.get);
router.put('/:id', (0, validate_1.validate)({ body: UpdateCommunitySchema }), communities_controller_1.communitiesController.update);
router.delete('/:id', communities_controller_1.communitiesController.delete);
// ── Membership ────────────────────────────────────────────────────────────────
router.post('/:id/join', communities_controller_1.communitiesController.join);
router.delete('/:id/join', communities_controller_1.communitiesController.leave);
router.get('/:id/members', (0, validate_1.validate)({ query: CursorQuerySchema }), communities_controller_1.communitiesController.getMembers);
router.get('/:id/pending', communities_controller_1.communitiesController.getPendingMembers);
router.put('/:id/members/:uid/role', (0, validate_1.validate)({ body: UpdateRoleSchema }), communities_controller_1.communitiesController.updateMemberRole);
router.delete('/:id/members/:uid', communities_controller_1.communitiesController.removeMember);
router.post('/:id/members/:uid/approve', communities_controller_1.communitiesController.approveMember);
router.post('/:id/members/:uid/reject', communities_controller_1.communitiesController.rejectMember);
// ── Invites ───────────────────────────────────────────────────────────────────
router.post('/:id/invites', (0, validate_1.validate)({ body: InviteSchema }), communities_controller_1.communitiesController.inviteMember);
router.post('/:id/invites/accept', communities_controller_1.communitiesController.acceptInvite);
router.post('/:id/invites/decline', communities_controller_1.communitiesController.declineInvite);
// ── Rules ─────────────────────────────────────────────────────────────────────
router.get('/:id/rules', communities_controller_1.communitiesController.getRules);
router.post('/:id/rules', (0, validate_1.validate)({ body: RuleSchema }), communities_controller_1.communitiesController.addRule);
router.put('/:id/rules/:rid', (0, validate_1.validate)({ body: RuleSchema.partial() }), communities_controller_1.communitiesController.updateRule);
router.delete('/:id/rules/:rid', communities_controller_1.communitiesController.deleteRule);
// ── Posts ─────────────────────────────────────────────────────────────────────
router.get('/:id/posts', (0, validate_1.validate)({ query: CursorQuerySchema }), communities_controller_1.communitiesController.getPosts);
exports.default = router;
//# sourceMappingURL=communities.routes.js.map
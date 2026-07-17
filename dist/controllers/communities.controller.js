"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.communitiesController = void 0;
const communities_service_1 = require("../services/communities.service");
const ApiResponse_1 = require("../utils/ApiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.communitiesController = {
    list: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await communities_service_1.communitiesService.list(req.query);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    create: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const community = await communities_service_1.communitiesService.create(req.user.id, req.body);
        res.status(201).json(new ApiResponse_1.ApiResponse(201, community, 'Community created'));
    }),
    get: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const community = await communities_service_1.communitiesService.getById(req.params['id'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, community));
    }),
    update: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const community = await communities_service_1.communitiesService.update(req.params['id'], req.user.id, req.body);
        res.json(new ApiResponse_1.ApiResponse(200, community, 'Community updated'));
    }),
    delete: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await communities_service_1.communitiesService.delete(req.params['id'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Community deleted'));
    }),
    join: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await communities_service_1.communitiesService.join(req.params['id'], req.user.id);
        const msg = result.status === 'PENDING' ? 'Join request sent' : 'Joined successfully';
        res.json(new ApiResponse_1.ApiResponse(200, result, msg));
    }),
    leave: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await communities_service_1.communitiesService.leave(req.params['id'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Left community'));
    }),
    getMembers: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { cursor, limit } = req.query;
        const result = await communities_service_1.communitiesService.getMembers(req.params['id'], cursor, limit ? parseInt(limit) : 20);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    getPendingMembers: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await communities_service_1.communitiesService.getPendingMembers(req.params['id'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    updateMemberRole: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { role } = req.body;
        const result = await communities_service_1.communitiesService.updateMemberRole(req.params['id'], req.user.id, req.params['uid'], role);
        res.json(new ApiResponse_1.ApiResponse(200, result, 'Role updated'));
    }),
    removeMember: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await communities_service_1.communitiesService.removeMember(req.params['id'], req.user.id, req.params['uid']);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Member removed'));
    }),
    approveMember: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await communities_service_1.communitiesService.approveMember(req.params['id'], req.user.id, req.params['uid']);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Member approved'));
    }),
    rejectMember: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await communities_service_1.communitiesService.rejectMember(req.params['id'], req.user.id, req.params['uid']);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Member rejected'));
    }),
    inviteMember: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { userId } = req.body;
        await communities_service_1.communitiesService.inviteMember(req.params['id'], req.user.id, userId);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Invite sent'));
    }),
    acceptInvite: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await communities_service_1.communitiesService.acceptInvite(req.params['id'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Invite accepted'));
    }),
    declineInvite: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await communities_service_1.communitiesService.declineInvite(req.params['id'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Invite declined'));
    }),
    getMyInvites: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const invites = await communities_service_1.communitiesService.getMyInvites(req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, invites));
    }),
    getRules: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const rules = await communities_service_1.communitiesService.getRules(req.params['id']);
        res.json(new ApiResponse_1.ApiResponse(200, rules));
    }),
    addRule: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const rule = await communities_service_1.communitiesService.addRule(req.params['id'], req.user.id, req.body);
        res.status(201).json(new ApiResponse_1.ApiResponse(201, rule, 'Rule added'));
    }),
    updateRule: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const rule = await communities_service_1.communitiesService.updateRule(req.params['id'], req.params['rid'], req.user.id, req.body);
        res.json(new ApiResponse_1.ApiResponse(200, rule, 'Rule updated'));
    }),
    deleteRule: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await communities_service_1.communitiesService.deleteRule(req.params['id'], req.params['rid'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Rule deleted'));
    }),
    getPosts: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { cursor, limit } = req.query;
        const result = await communities_service_1.communitiesService.getCommunityPosts(req.params['id'], cursor, limit ? parseInt(limit) : 20);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
};
//# sourceMappingURL=communities.controller.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderationController = void 0;
const moderation_service_1 = require("../services/moderation.service");
const ApiResponse_1 = require("../utils/ApiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.moderationController = {
    submitReport: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = req.body;
        const report = await moderation_service_1.moderationService.submitReport(req.user.id, data);
        res.status(201).json(new ApiResponse_1.ApiResponse(201, report, 'Report submitted'));
    }),
    listReports: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { status, skip, take } = req.query;
        const reports = await moderation_service_1.moderationService.listReports({ status, skip: skip ? parseInt(skip) : 0, take: take ? parseInt(take) : 20 });
        res.json(new ApiResponse_1.ApiResponse(200, reports));
    }),
    updateReport: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { status } = req.body;
        const report = await moderation_service_1.moderationService.updateReport(req.params['id'], status);
        res.json(new ApiResponse_1.ApiResponse(200, report, 'Report updated'));
    }),
    banUser: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await moderation_service_1.moderationService.banUser(req.params['id']);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'User banned'));
    }),
    unbanUser: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await moderation_service_1.moderationService.unbanUser(req.params['id']);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'User unbanned'));
    }),
    removePost: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await moderation_service_1.moderationService.removePost(req.params['id']);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Post removed'));
    }),
};
//# sourceMappingURL=moderation.controller.js.map
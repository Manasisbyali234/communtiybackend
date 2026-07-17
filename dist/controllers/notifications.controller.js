"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsController = void 0;
const notifications_service_1 = require("../services/notifications.service");
const ApiResponse_1 = require("../utils/ApiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.notificationsController = {
    list: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { cursor, limit, unreadOnly } = req.query;
        const result = await notifications_service_1.notificationsService.list(req.user.id, { cursor, limit: limit ? parseInt(limit) : 20, unreadOnly: unreadOnly === 'true' });
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    unreadCount: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const count = await notifications_service_1.notificationsService.unreadCount(req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, { count }));
    }),
    markRead: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await notifications_service_1.notificationsService.markRead(req.params['id'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Marked as read'));
    }),
    markAllRead: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await notifications_service_1.notificationsService.markAllRead(req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'All notifications marked as read'));
    }),
    delete: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await notifications_service_1.notificationsService.delete(req.params['id'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Notification deleted'));
    }),
};
//# sourceMappingURL=notifications.controller.js.map
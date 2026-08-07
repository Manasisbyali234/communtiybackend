"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionsController = void 0;
const connections_service_1 = require("../services/connections.service");
const ApiResponse_1 = require("../utils/ApiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.connectionsController = {
    send: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const request = await connections_service_1.connectionsService.sendRequest(req.user.id, req.params['userId']);
        res.status(201).json(new ApiResponse_1.ApiResponse(201, request, 'Connection request sent'));
    }),
    accept: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await connections_service_1.connectionsService.acceptRequest(req.params['requestId'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, result, 'Connection accepted'));
    }),
    reject: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await connections_service_1.connectionsService.rejectRequest(req.params['requestId'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Connection rejected'));
    }),
    getStatus: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const status = await connections_service_1.connectionsService.getStatus(req.user.id, req.params['userId']);
        res.json(new ApiResponse_1.ApiResponse(200, status));
    }),
    getConnections: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const userId = req.params['userId'] || req.user.id;
        const connections = await connections_service_1.connectionsService.getConnections(userId);
        res.json(new ApiResponse_1.ApiResponse(200, connections));
    }),
    getCount: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const userId = req.params['userId'] || req.user.id;
        const count = await connections_service_1.connectionsService.getConnectionCount(userId);
        res.json(new ApiResponse_1.ApiResponse(200, { count }));
    }),
    getPending: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const pending = await connections_service_1.connectionsService.getPendingReceived(req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, pending));
    }),
};
//# sourceMappingURL=connections.controller.js.map
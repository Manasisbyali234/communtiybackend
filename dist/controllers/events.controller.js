"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventsController = void 0;
const events_service_1 = require("../services/events.service");
const ApiResponse_1 = require("../utils/ApiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.eventsController = {
    list: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { cursor, limit, communityId, upcoming, search } = req.query;
        const result = await events_service_1.eventsService.list({ cursor, limit: limit ? parseInt(limit) : 20, communityId, upcoming: upcoming === 'true', search });
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    create: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { startsAt, endsAt, ...rest } = req.body;
        const event = await events_service_1.eventsService.create(req.user.id, { ...rest, startsAt: new Date(startsAt), ...(endsAt ? { endsAt: new Date(endsAt) } : {}) });
        res.status(201).json(new ApiResponse_1.ApiResponse(201, event, 'Event created'));
    }),
    get: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const event = await events_service_1.eventsService.getById(req.params['id'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, event));
    }),
    update: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const event = await events_service_1.eventsService.update(req.params['id'], req.user.id, req.body);
        res.json(new ApiResponse_1.ApiResponse(200, event, 'Event updated'));
    }),
    delete: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await events_service_1.eventsService.delete(req.params['id'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Event deleted'));
    }),
    rsvp: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { status } = req.body;
        const rsvp = await events_service_1.eventsService.rsvp(req.params['id'], req.user.id, status);
        res.json(new ApiResponse_1.ApiResponse(200, rsvp));
    }),
    cancelRsvp: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await events_service_1.eventsService.cancelRsvp(req.params['id'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'RSVP cancelled'));
    }),
    getAttendees: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { cursor, limit } = req.query;
        const result = await events_service_1.eventsService.getAttendees(req.params['id'], cursor, limit ? parseInt(limit) : 20);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
};
//# sourceMappingURL=events.controller.js.map
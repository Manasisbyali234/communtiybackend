"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventsController = void 0;
const events_service_1 = require("../services/events.service");
const ApiResponse_1 = require("../utils/ApiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.eventsController = {
    list: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { cursor, limit, communityId, upcoming, search, mine } = req.query;
        const result = await events_service_1.eventsService.list({
            cursor: typeof cursor === 'string' ? cursor : undefined,
            limit: limit ? parseInt(String(limit)) : 20,
            communityId: typeof communityId === 'string' ? communityId : undefined,
            upcoming: upcoming === true || upcoming === 'true',
            search: typeof search === 'string' ? search : undefined,
            userId: req.user.id,
            creatorId: mine === true || mine === 'true' ? req.user.id : undefined,
            includeUnapproved: mine === true || mine === 'true',
        });
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
    toggleInterest: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await events_service_1.eventsService.toggleInterest(req.params['id'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    toggleLike: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await events_service_1.eventsService.toggleLike(req.params['id'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    shareEvent: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await events_service_1.eventsService.shareEvent(req.params['id'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    getComments: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { cursor, limit } = req.query;
        const result = await events_service_1.eventsService.getComments(req.params['id'], cursor, limit ? parseInt(limit) : 20);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    addComment: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { content } = req.body;
        const comment = await events_service_1.eventsService.addComment(req.params['id'], req.user.id, content);
        res.status(201).json(new ApiResponse_1.ApiResponse(201, comment, 'Comment added'));
    }),
    updateComment: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { content } = req.body;
        const comment = await events_service_1.eventsService.updateComment(req.params['commentId'], req.user.id, content);
        res.json(new ApiResponse_1.ApiResponse(200, comment, 'Comment updated'));
    }),
    deleteComment: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await events_service_1.eventsService.deleteComment(req.params['commentId'], req.params['id'], req.user.id, req.user.role);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Comment deleted'));
    }),
};
//# sourceMappingURL=events.controller.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const events_controller_1 = require("../../controllers/events.controller");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const router = (0, express_1.Router)();
router.use(auth_1.auth);
const CreateEventSchema = zod_1.z.object({
    title: zod_1.z.string().min(3).max(120),
    description: zod_1.z.string().max(2000).optional(),
    location: zod_1.z.string().max(200).optional(),
    startsAt: zod_1.z.string().datetime(),
    endsAt: zod_1.z.string().datetime().optional(),
    coverUrl: zod_1.z.string().min(1).optional().or(zod_1.z.literal('')).transform(v => v || undefined),
    communityId: zod_1.z.string().cuid().optional().or(zod_1.z.literal('')).transform(v => v || undefined),
});
const RsvpSchema = zod_1.z.object({ status: zod_1.z.enum(['GOING', 'MAYBE', 'NOT_GOING']) });
const QuerySchema = zod_1.z.object({
    cursor: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
    communityId: zod_1.z.string().cuid().optional().or(zod_1.z.literal('')).transform(v => v || undefined),
    upcoming: zod_1.z.coerce.boolean().optional(),
    search: zod_1.z.string().optional(),
    mine: zod_1.z.coerce.boolean().optional(),
});
router.get('/', (0, validate_1.validate)({ query: QuerySchema }), events_controller_1.eventsController.list);
router.post('/', (0, validate_1.validate)({ body: CreateEventSchema }), events_controller_1.eventsController.create);
router.get('/:id', events_controller_1.eventsController.get);
router.put('/:id', (0, validate_1.validate)({ body: CreateEventSchema.partial() }), events_controller_1.eventsController.update);
router.delete('/:id', events_controller_1.eventsController.delete);
router.post('/:id/rsvp', (0, validate_1.validate)({ body: RsvpSchema }), events_controller_1.eventsController.rsvp);
router.delete('/:id/rsvp', events_controller_1.eventsController.cancelRsvp);
router.get('/:id/attendees', events_controller_1.eventsController.getAttendees);
router.post('/:id/interest', events_controller_1.eventsController.toggleInterest);
router.post('/:id/like', events_controller_1.eventsController.toggleLike);
router.post('/:id/share', events_controller_1.eventsController.shareEvent);
router.get('/:id/comments', events_controller_1.eventsController.getComments);
router.post('/:id/comments', (0, validate_1.validate)({ body: zod_1.z.object({ content: zod_1.z.string().min(1).max(1000) }) }), events_controller_1.eventsController.addComment);
router.put('/:id/comments/:commentId', (0, validate_1.validate)({ body: zod_1.z.object({ content: zod_1.z.string().min(1).max(1000) }) }), events_controller_1.eventsController.updateComment);
router.delete('/:id/comments/:commentId', events_controller_1.eventsController.deleteComment);
exports.default = router;
//# sourceMappingURL=events.routes.js.map
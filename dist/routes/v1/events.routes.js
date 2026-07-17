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
    coverUrl: zod_1.z.string().url().optional(),
    communityId: zod_1.z.string().cuid().optional(),
});
const RsvpSchema = zod_1.z.object({ status: zod_1.z.enum(['GOING', 'MAYBE', 'NOT_GOING']) });
const QuerySchema = zod_1.z.object({
    cursor: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
    communityId: zod_1.z.string().cuid().optional(),
    upcoming: zod_1.z.coerce.boolean().optional(),
    search: zod_1.z.string().optional(),
});
router.get('/', (0, validate_1.validate)({ query: QuerySchema }), events_controller_1.eventsController.list);
router.post('/', (0, validate_1.validate)({ body: CreateEventSchema }), events_controller_1.eventsController.create);
router.get('/:id', events_controller_1.eventsController.get);
router.put('/:id', (0, validate_1.validate)({ body: CreateEventSchema.partial() }), events_controller_1.eventsController.update);
router.delete('/:id', events_controller_1.eventsController.delete);
router.post('/:id/rsvp', (0, validate_1.validate)({ body: RsvpSchema }), events_controller_1.eventsController.rsvp);
router.delete('/:id/rsvp', events_controller_1.eventsController.cancelRsvp);
router.get('/:id/attendees', events_controller_1.eventsController.getAttendees);
exports.default = router;
//# sourceMappingURL=events.routes.js.map
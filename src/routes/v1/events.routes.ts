import { Router } from 'express';
import { z } from 'zod';
import { eventsController } from '../../controllers/events.controller';
import { auth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

const router = Router();
router.use(auth);

const CreateEventSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  coverUrl: z.string().min(1).optional().or(z.literal('')).transform(v => v || undefined),
  communityId: z.string().cuid().optional().or(z.literal('')).transform(v => v || undefined),
});

const RsvpSchema = z.object({ status: z.enum(['GOING', 'MAYBE', 'NOT_GOING']) });

const QuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  communityId: z.string().cuid().optional().or(z.literal('')).transform(v => v || undefined),
  upcoming: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

router.get('/', validate({ query: QuerySchema }), eventsController.list);
router.post('/', validate({ body: CreateEventSchema }), eventsController.create);
router.get('/:id', eventsController.get);
router.put('/:id', validate({ body: CreateEventSchema.partial() }), eventsController.update);
router.delete('/:id', eventsController.delete);
router.post('/:id/rsvp', validate({ body: RsvpSchema }), eventsController.rsvp);
router.delete('/:id/rsvp', eventsController.cancelRsvp);
router.get('/:id/attendees', eventsController.getAttendees);
router.post('/:id/interest', eventsController.toggleInterest);
router.post('/:id/like', eventsController.toggleLike);
router.post('/:id/share', eventsController.shareEvent);
router.get('/:id/comments', eventsController.getComments);
router.post('/:id/comments', validate({ body: z.object({ content: z.string().min(1).max(1000) }) }), eventsController.addComment);
router.put('/:id/comments/:commentId', validate({ body: z.object({ content: z.string().min(1).max(1000) }) }), eventsController.updateComment);
router.delete('/:id/comments/:commentId', eventsController.deleteComment);

export default router;

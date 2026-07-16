import { Router } from 'express';
import { z } from 'zod';
import { storiesController } from '../../controllers/stories.controller';
import { auth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

const router = Router();

const CreateStorySchema = z.object({
  mediaUrl: z.string().url(),
  mediaType: z.enum(['IMAGE', 'VIDEO']),
});

const ReplySchema = z.object({ content: z.string().min(1).max(500) });

router.use(auth);

router.get('/feed', storiesController.getFeed);
router.get('/:id', storiesController.getStory);
router.post('/', validate({ body: CreateStorySchema }), storiesController.createStory);
router.delete('/:id', storiesController.deleteStory);
router.post('/:id/view', storiesController.viewStory);
router.get('/:id/viewers', storiesController.getViewers);
router.post('/:id/like', storiesController.likeStory);
router.delete('/:id/like', storiesController.unlikeStory);
router.post('/:id/reply', validate({ body: ReplySchema }), storiesController.replyToStory);
router.get('/:id/replies', storiesController.getStoryReplies);

export default router;

import { Router } from 'express';
import { z } from 'zod';
import { exploreController } from '../../controllers/explore.controller';
import { auth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

const router = Router();
router.use(auth);

const LimitSchema = z.object({ limit: z.coerce.number().min(1).max(50).default(20) });
const HashtagSchema = z.object({ cursor: z.string().optional(), limit: z.coerce.number().min(1).max(50).default(20) });

router.get('/trending-posts', validate({ query: LimitSchema }), exploreController.getTrendingPosts);
router.get('/trending-communities', validate({ query: LimitSchema }), exploreController.getTrendingCommunities);
router.get('/trending-hashtags', validate({ query: LimitSchema }), exploreController.getTrendingHashtags);
router.get('/suggested-users', validate({ query: LimitSchema }), exploreController.getSuggestedUsers);
router.get('/suggested-communities', validate({ query: LimitSchema }), exploreController.getSuggestedCommunities);
router.get('/hashtag/:name', validate({ query: HashtagSchema }), exploreController.getPostsByHashtag);

export default router;

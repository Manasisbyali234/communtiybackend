import { Router } from 'express';
import { z } from 'zod';
import { searchController } from '../../controllers/search.controller';
import { auth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

const router = Router();
router.use(auth);

const SearchSchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().min(1).max(50).default(10),
  type: z.enum(['all', 'users', 'posts', 'communities', 'events', 'hashtags']).default('all'),
});

router.get('/', validate({ query: SearchSchema }), searchController.search);
router.get('/users', validate({ query: SearchSchema }), searchController.searchUsers);
router.get('/posts', validate({ query: SearchSchema }), searchController.searchPosts);
router.get('/communities', validate({ query: SearchSchema }), searchController.searchCommunities);
router.get('/events', validate({ query: SearchSchema }), searchController.searchEvents);
router.get('/hashtags', validate({ query: SearchSchema }), searchController.searchHashtags);

export default router;

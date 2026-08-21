import { Router } from 'express';
import { auth } from '../../middleware/auth';
import * as directory from '../../controllers/directory.controller';

const router = Router();
router.use(auth);

router.get('/businesses', directory.listBusinesses);
router.get('/businesses/mine', directory.myBusinesses);
router.get('/businesses/admin', directory.listBusinessesAdmin);
router.post('/businesses', directory.createBusiness);
router.get('/businesses/:id', directory.getBusiness);
router.patch('/businesses/:id', directory.updateBusiness);
router.delete('/businesses/:id', directory.deleteBusiness);
router.post('/businesses/:id/contact', directory.contactBusiness);
router.post('/businesses/:id/reviews', directory.addBusinessReview);
router.patch('/businesses/:id/moderate', directory.businessModeration);

router.get('/help-requests', directory.listHelp);
router.get('/help-requests/mine', directory.myHelp);
router.get('/help-requests/admin', directory.listHelpAdmin);
router.post('/help-requests', directory.createHelp);
router.get('/help-requests/:id', directory.getHelp);
router.post('/help-requests/:id/offers', directory.offerHelp);
router.patch('/help-requests/:id/moderate', directory.moderateHelp);
router.patch('/help-requests/:id/resolve', directory.resolveHelp);
router.delete('/help-requests/:id', directory.deleteHelp);

router.get('/community-stories', directory.listCommunityStories);
router.get('/community-stories/admin', directory.listCommunityStoriesAdmin);
router.post('/community-stories', directory.createCommunityStory);
router.get('/community-stories/:id', directory.getCommunityStory);
router.patch('/community-stories/:id', directory.updateCommunityStory);
router.delete('/community-stories/:id', directory.deleteCommunityStory);

export default router;

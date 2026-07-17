import { Router } from 'express';
import { connectionsController } from '../../controllers/connections.controller';
import { auth } from '../../middleware/auth';

const router = Router();
router.use(auth);

router.post('/:userId/request', connectionsController.send);
router.post('/requests/:requestId/accept', connectionsController.accept);
router.post('/requests/:requestId/reject', connectionsController.reject);
router.get('/:userId/status', connectionsController.getStatus);
router.get('/me/connections', connectionsController.getConnections);
router.get('/me/connections/count', connectionsController.getCount);
router.get('/:userId/connections', connectionsController.getConnections);
router.get('/:userId/connections/count', connectionsController.getCount);
router.get('/me/pending', connectionsController.getPending);

export default router;

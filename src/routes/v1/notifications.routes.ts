import { Router } from 'express';
import { notificationsController } from '../../controllers/notifications.controller';
import { auth } from '../../middleware/auth';

const router = Router();
router.use(auth);

router.get('/', notificationsController.list);
router.get('/unread-count', notificationsController.unreadCount);
router.put('/read-all', notificationsController.markAllRead);
router.put('/:id/read', notificationsController.markRead);
router.delete('/:id', notificationsController.delete);

export default router;

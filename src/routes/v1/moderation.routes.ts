import { Router } from 'express';
import { z } from 'zod';
import { moderationController } from '../../controllers/moderation.controller';
import { auth } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';

const router = Router();
router.use(auth);

const ReportSchema = z.object({
  postId: z.string().cuid().optional(),
  reportedUserId: z.string().cuid().optional(),
  reason: z.enum(['SPAM', 'HARASSMENT', 'HATE_SPEECH', 'MISINFORMATION', 'NUDITY', 'VIOLENCE', 'OTHER']),
  details: z.string().max(1000).optional(),
});

const UpdateReportSchema = z.object({
  status: z.enum(['REVIEWED', 'RESOLVED', 'DISMISSED']),
});

// Any authenticated user can submit reports
router.post('/reports', validate({ body: ReportSchema }), moderationController.submitReport);

// Moderator/Admin only
router.get('/reports', rbac('ADMIN', 'MODERATOR'), moderationController.listReports);
router.put('/reports/:id', rbac('ADMIN', 'MODERATOR'), validate({ body: UpdateReportSchema }), moderationController.updateReport);
router.post('/posts/:id/remove', rbac('ADMIN', 'MODERATOR'), moderationController.removePost);

// Admin only
router.post('/users/:id/ban', rbac('ADMIN'), moderationController.banUser);
router.delete('/users/:id/ban', rbac('ADMIN'), moderationController.unbanUser);

export default router;

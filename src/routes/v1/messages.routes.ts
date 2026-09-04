import { Router } from 'express';
import { z } from 'zod';
import { messagesController } from '../../controllers/messages.controller';
import { auth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { messagesRateLimiter } from '../../middleware/rateLimiter';

const router = Router();
router.use(auth);
router.use(messagesRateLimiter);

const StartConversationSchema = z.object({ participantId: z.string().min(1) });

const SendMessageSchema = z.object({
  content: z.string().max(5000).optional(),
  mediaUrl: z.string().min(1).optional(), // accepts both absolute URLs and relative proxy paths
  mediaType: z.enum(['IMAGE', 'VIDEO', 'AUDIO']).optional(),
}).refine((d) => d.content ?? d.mediaUrl, { message: 'Either content or mediaUrl is required' });

const CursorQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(30),
});

const ReactionSchema = z.object({ emoji: z.string().min(1).max(10) });

router.get('/conversations', messagesController.getConversations);
router.get('/unread-count', messagesController.getUnreadCount);
router.post('/conversations', validate({ body: StartConversationSchema }), messagesController.getOrCreate);
router.get('/conversations/:id', validate({ query: CursorQuerySchema }), messagesController.getMessages);
router.post('/conversations/:id', validate({ body: SendMessageSchema }), messagesController.sendMessage);
router.put('/conversations/:id/read', messagesController.markRead);

// Message actions
router.post('/messages/:msgId/reactions', validate({ body: ReactionSchema }), messagesController.addReaction);
router.delete('/messages/:msgId/reactions/:emoji', messagesController.removeReaction);
router.delete('/messages/:msgId/everyone', messagesController.deleteForEveryone);
router.delete('/messages/:msgId/me', messagesController.deleteForMe);

export default router;

import { Request, Response } from 'express';
import { notificationsService } from '../services/notifications.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const notificationsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { cursor, limit, unreadOnly } = req.query as { cursor?: string; limit?: string; unreadOnly?: string };
    const result = await notificationsService.list(req.user.id, { cursor, limit: limit ? parseInt(limit) : 20, unreadOnly: unreadOnly === 'true' });
    res.json(new ApiResponse(200, result));
  }),

  unreadCount: asyncHandler(async (req: Request, res: Response) => {
    const count = await notificationsService.unreadCount(req.user.id);
    res.json(new ApiResponse(200, { count }));
  }),

  markRead: asyncHandler(async (req: Request, res: Response) => {
    await notificationsService.markRead(req.params['id'] as string, req.user.id);
    res.json(new ApiResponse(200, null, 'Marked as read'));
  }),

  markAllRead: asyncHandler(async (req: Request, res: Response) => {
    await notificationsService.markAllRead(req.user.id);
    res.json(new ApiResponse(200, null, 'All notifications marked as read'));
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await notificationsService.delete(req.params['id'] as string, req.user.id);
    res.json(new ApiResponse(200, null, 'Notification deleted'));
  }),
};

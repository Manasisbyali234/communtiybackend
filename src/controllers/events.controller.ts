import { Request, Response } from 'express';
import { eventsService } from '../services/events.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { RsvpStatus } from '@prisma/client';

export const eventsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { cursor, limit, communityId, upcoming, search } = req.query as Record<string, string | undefined>;
    const result = await eventsService.list({ cursor, limit: limit ? parseInt(limit) : 20, communityId, upcoming: upcoming === 'true', search, userId: req.user.id });
    res.json(new ApiResponse(200, result));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const { startsAt, endsAt, ...rest } = req.body as { title: string; description?: string; location?: string; startsAt: string; endsAt?: string; coverUrl?: string; communityId?: string };
    const event = await eventsService.create(req.user.id, { ...rest, startsAt: new Date(startsAt), ...(endsAt ? { endsAt: new Date(endsAt) } : {}) });
    res.status(201).json(new ApiResponse(201, event, 'Event created'));
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const event = await eventsService.getById(req.params['id'] as string, req.user.id);
    res.json(new ApiResponse(200, event));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const event = await eventsService.update(req.params['id'] as string, req.user.id, req.body as Record<string, string>);
    res.json(new ApiResponse(200, event, 'Event updated'));
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await eventsService.delete(req.params['id'] as string, req.user.id);
    res.json(new ApiResponse(200, null, 'Event deleted'));
  }),

  rsvp: asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body as { status: RsvpStatus };
    const rsvp = await eventsService.rsvp(req.params['id'] as string, req.user.id, status);
    res.json(new ApiResponse(200, rsvp));
  }),

  cancelRsvp: asyncHandler(async (req: Request, res: Response) => {
    await eventsService.cancelRsvp(req.params['id'] as string, req.user.id);
    res.json(new ApiResponse(200, null, 'RSVP cancelled'));
  }),

  getAttendees: asyncHandler(async (req: Request, res: Response) => {
    const { cursor, limit } = req.query as { cursor?: string; limit?: string };
    const result = await eventsService.getAttendees(req.params['id'] as string, cursor, limit ? parseInt(limit) : 20);
    res.json(new ApiResponse(200, result));
  }),

  toggleInterest: asyncHandler(async (req: Request, res: Response) => {
    const result = await eventsService.toggleInterest(req.params['id'] as string, req.user.id);
    res.json(new ApiResponse(200, result));
  }),

  toggleLike: asyncHandler(async (req: Request, res: Response) => {
    const result = await eventsService.toggleLike(req.params['id'] as string, req.user.id);
    res.json(new ApiResponse(200, result));
  }),

  shareEvent: asyncHandler(async (req: Request, res: Response) => {
    const result = await eventsService.shareEvent(req.params['id'] as string, req.user.id);
    res.json(new ApiResponse(200, result));
  }),

  getComments: asyncHandler(async (req: Request, res: Response) => {
    const { cursor, limit } = req.query as { cursor?: string; limit?: string };
    const result = await eventsService.getComments(req.params['id'] as string, cursor, limit ? parseInt(limit) : 20);
    res.json(new ApiResponse(200, result));
  }),

  addComment: asyncHandler(async (req: Request, res: Response) => {
    const { content } = req.body as { content: string };
    const comment = await eventsService.addComment(req.params['id'] as string, req.user.id, content);
    res.status(201).json(new ApiResponse(201, comment, 'Comment added'));
  }),

  updateComment: asyncHandler(async (req: Request, res: Response) => {
    const { content } = req.body as { content: string };
    const comment = await eventsService.updateComment(req.params['commentId'] as string, req.user.id, content);
    res.json(new ApiResponse(200, comment, 'Comment updated'));
  }),

  deleteComment: asyncHandler(async (req: Request, res: Response) => {
    await eventsService.deleteComment(req.params['commentId'] as string, req.params['id'] as string, req.user.id, req.user.role);
    res.json(new ApiResponse(200, null, 'Comment deleted'));
  }),
};

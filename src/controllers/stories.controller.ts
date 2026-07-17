import { Request, Response } from 'express';
import { storiesService } from '../services/stories.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { MediaType } from '@prisma/client';

export const storiesController = {
  getStory: asyncHandler(async (req: Request, res: Response) => {
    const story = await storiesService.getById(req.params['id'] as string);
    res.json(new ApiResponse(200, story));
  }),

  getFeed: asyncHandler(async (req: Request, res: Response) => {
    const result = await storiesService.getFeed(req.user.id);
    res.json(new ApiResponse(200, result));
  }),

  createStory: asyncHandler(async (req: Request, res: Response) => {
    const { mediaUrl, mediaType } = req.body as { mediaUrl: string; mediaType: MediaType };
    const story = await storiesService.create(req.user.id, mediaUrl, mediaType);
    res.status(201).json(new ApiResponse(201, story, 'Story created'));
  }),

  deleteStory: asyncHandler(async (req: Request, res: Response) => {
    await storiesService.delete(req.params['id'] as string, req.user.id);
    res.json(new ApiResponse(200, null, 'Story deleted'));
  }),

  viewStory: asyncHandler(async (req: Request, res: Response) => {
    await storiesService.recordView(req.params['id'] as string, req.user.id);
    res.json(new ApiResponse(200, null, 'View recorded'));
  }),

  getViewers: asyncHandler(async (req: Request, res: Response) => {
    const viewers = await storiesService.getViewers(req.params['id'] as string, req.user.id);
    res.json(new ApiResponse(200, viewers));
  }),

  likeStory: asyncHandler(async (req: Request, res: Response) => {
    await storiesService.likeStory(req.params['id'] as string, req.user.id);
    res.json(new ApiResponse(200, null, 'Story liked'));
  }),

  unlikeStory: asyncHandler(async (req: Request, res: Response) => {
    await storiesService.unlikeStory(req.params['id'] as string, req.user.id);
    res.json(new ApiResponse(200, null, 'Story unliked'));
  }),

  replyToStory: asyncHandler(async (req: Request, res: Response) => {
    const { content } = req.body as { content: string };
    const reply = await storiesService.replyToStory(req.params['id'] as string, req.user.id, content);
    res.status(201).json(new ApiResponse(201, reply, 'Reply sent'));
  }),

  getStoryReplies: asyncHandler(async (req: Request, res: Response) => {
    const replies = await storiesService.getStoryReplies(req.params['id'] as string, req.user.id);
    res.json(new ApiResponse(200, replies));
  }),
};

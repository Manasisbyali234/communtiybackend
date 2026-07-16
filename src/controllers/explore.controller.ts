import { Request, Response } from 'express';
import { exploreService } from '../services/explore.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const exploreController = {
  getTrendingPosts: asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.query as { limit?: string };
    const result = await exploreService.getTrendingPosts(req.user.id, limit ? parseInt(limit) : 20);
    res.json(new ApiResponse(200, result));
  }),

  getTrendingCommunities: asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.query as { limit?: string };
    const result = await exploreService.getTrendingCommunities(limit ? parseInt(limit) : 10);
    res.json(new ApiResponse(200, result));
  }),

  getTrendingHashtags: asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.query as { limit?: string };
    const result = await exploreService.getTrendingHashtags(limit ? parseInt(limit) : 20);
    res.json(new ApiResponse(200, result));
  }),

  getSuggestedUsers: asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.query as { limit?: string };
    const result = await exploreService.getSuggestedUsers(req.user.id, limit ? parseInt(limit) : 10);
    res.json(new ApiResponse(200, result));
  }),

  getSuggestedCommunities: asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.query as { limit?: string };
    const result = await exploreService.getSuggestedCommunities(req.user.id, limit ? parseInt(limit) : 10);
    res.json(new ApiResponse(200, result));
  }),

  getPostsByHashtag: asyncHandler(async (req: Request, res: Response) => {
    const { cursor, limit } = req.query as { cursor?: string; limit?: string };
    const result = await exploreService.getPostsByHashtag(req.params['name'], req.user.id, cursor, limit ? parseInt(limit) : 20);
    res.json(new ApiResponse(200, result));
  }),
};

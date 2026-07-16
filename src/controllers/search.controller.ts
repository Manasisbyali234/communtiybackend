import { Request, Response } from 'express';
import { searchService } from '../services/search.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const searchController = {
  search: asyncHandler(async (req: Request, res: Response) => {
    const { q, limit } = req.query as { q: string; limit?: string };
    const result = await searchService.search(q, req.user.id, limit ? parseInt(limit) : 10);
    res.json(new ApiResponse(200, result));
  }),

  searchUsers: asyncHandler(async (req: Request, res: Response) => {
    const { q, limit } = req.query as { q: string; limit?: string };
    const result = await searchService.searchUsers(q, req.user.id, limit ? parseInt(limit) : 20);
    res.json(new ApiResponse(200, result));
  }),

  searchPosts: asyncHandler(async (req: Request, res: Response) => {
    const { q, limit } = req.query as { q: string; limit?: string };
    const result = await searchService.searchPosts(q, req.user.id, limit ? parseInt(limit) : 20);
    res.json(new ApiResponse(200, result));
  }),

  searchCommunities: asyncHandler(async (req: Request, res: Response) => {
    const { q, limit } = req.query as { q: string; limit?: string };
    const result = await searchService.searchCommunities(q, limit ? parseInt(limit) : 20);
    res.json(new ApiResponse(200, result));
  }),

  searchEvents: asyncHandler(async (req: Request, res: Response) => {
    const { q, limit } = req.query as { q: string; limit?: string };
    const result = await searchService.searchEvents(q, limit ? parseInt(limit) : 20);
    res.json(new ApiResponse(200, result));
  }),

  searchHashtags: asyncHandler(async (req: Request, res: Response) => {
    const { q, limit } = req.query as { q: string; limit?: string };
    const result = await searchService.searchHashtags(q, limit ? parseInt(limit) : 20);
    res.json(new ApiResponse(200, result));
  }),
};

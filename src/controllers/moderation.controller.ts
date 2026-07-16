import { Request, Response } from 'express';
import { moderationService } from '../services/moderation.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ReportReason, ReportStatus } from '@prisma/client';

export const moderationController = {
  submitReport: asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as { postId?: string; reportedUserId?: string; reason: ReportReason; details?: string };
    const report = await moderationService.submitReport(req.user.id, data);
    res.status(201).json(new ApiResponse(201, report, 'Report submitted'));
  }),

  listReports: asyncHandler(async (req: Request, res: Response) => {
    const { status, skip, take } = req.query as { status?: ReportStatus; skip?: string; take?: string };
    const reports = await moderationService.listReports({ status, skip: skip ? parseInt(skip) : 0, take: take ? parseInt(take) : 20 });
    res.json(new ApiResponse(200, reports));
  }),

  updateReport: asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body as { status: ReportStatus };
    const report = await moderationService.updateReport(req.params['id'] as string, status);
    res.json(new ApiResponse(200, report, 'Report updated'));
  }),

  banUser: asyncHandler(async (req: Request, res: Response) => {
    await moderationService.banUser(req.params['id'] as string);
    res.json(new ApiResponse(200, null, 'User banned'));
  }),

  unbanUser: asyncHandler(async (req: Request, res: Response) => {
    await moderationService.unbanUser(req.params['id'] as string);
    res.json(new ApiResponse(200, null, 'User unbanned'));
  }),

  removePost: asyncHandler(async (req: Request, res: Response) => {
    await moderationService.removePost(req.params['id'] as string);
    res.json(new ApiResponse(200, null, 'Post removed'));
  }),
};

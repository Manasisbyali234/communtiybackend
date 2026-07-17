import { Request, Response } from 'express';
import { connectionsService } from '../services/connections.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const connectionsController = {
  send: asyncHandler(async (req: Request, res: Response) => {
    const request = await connectionsService.sendRequest(req.user.id, req.params['userId']);
    res.status(201).json(new ApiResponse(201, request, 'Connection request sent'));
  }),

  accept: asyncHandler(async (req: Request, res: Response) => {
    const result = await connectionsService.acceptRequest(req.params['requestId'], req.user.id);
    res.json(new ApiResponse(200, result, 'Connection accepted'));
  }),

  reject: asyncHandler(async (req: Request, res: Response) => {
    await connectionsService.rejectRequest(req.params['requestId'], req.user.id);
    res.json(new ApiResponse(200, null, 'Connection rejected'));
  }),

  getStatus: asyncHandler(async (req: Request, res: Response) => {
    const status = await connectionsService.getStatus(req.user.id, req.params['userId']);
    res.json(new ApiResponse(200, status));
  }),

  getConnections: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req.params['userId'] as string) || req.user.id;
    const connections = await connectionsService.getConnections(userId);
    res.json(new ApiResponse(200, connections));
  }),

  getCount: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req.params['userId'] as string) || req.user.id;
    const count = await connectionsService.getConnectionCount(userId);
    res.json(new ApiResponse(200, { count }));
  }),

  getPending: asyncHandler(async (req: Request, res: Response) => {
    const pending = await connectionsService.getPendingReceived(req.user.id);
    res.json(new ApiResponse(200, pending));
  }),
};

import { Request, Response } from 'express';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { storyUploadService } from './story.upload.service';
import { storyR2Service } from './story.r2.service';
import { r2, storageBucket } from '../config/storage';
import { MediaType } from '@prisma/client';

export const storyUploadController = {
  // POST /api/v1/story-upload/upload
  uploadMedia: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw ApiError.badRequest('No file provided');

    storyR2Service.validate({
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    const result = await storyUploadService.uploadOnly({
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    res.json(new ApiResponse(200, { url: result.url, key: result.key }, 'Story media uploaded'));
  }),

  // POST /api/v1/story-upload/create
  uploadAndCreate: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw ApiError.badRequest('No file provided');

    const rawType = (req.body?.mediaType as string | undefined)?.toUpperCase();
    const mediaType: MediaType = rawType === 'VIDEO' ? 'VIDEO' : 'IMAGE';

    const story = await storyUploadService.uploadAndCreate(
      {
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
      req.user.id,
      mediaType
    );

    res.status(201).json(new ApiResponse(201, story, 'Story created'));
  }),

  // GET /api/v1/story-upload/proxy/:key(*)
  // Proxies R2 objects with range request support for video playback.
  proxyMedia: asyncHandler(async (req: Request, res: Response) => {
    const key = decodeURIComponent(req.params['key'] as string);
    try {
      const rangeHeader = req.headers['range'];
      const command = new GetObjectCommand({
        Bucket: storageBucket,
        Key: key,
        ...(rangeHeader ? { Range: rangeHeader } : {}),
      });
      const r2Res = await r2.send(command);

      res.setHeader('Content-Type', r2Res.ContentType ?? 'application/octet-stream');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=86400');

      if (rangeHeader && r2Res.ContentRange) {
        res.setHeader('Content-Range', r2Res.ContentRange);
        if (r2Res.ContentLength) res.setHeader('Content-Length', r2Res.ContentLength);
        res.status(206);
      } else {
        if (r2Res.ContentLength) res.setHeader('Content-Length', r2Res.ContentLength);
        res.status(200);
      }

      (r2Res.Body as Readable).pipe(res);
    } catch {
      throw ApiError.notFound('Story media not found');
    }
  }),
};

import { Request, Response } from 'express';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { storyUploadService } from './story.upload.service';
import { storyS3Service } from './story.s3.service';
import { s3, storageBucket } from '../config/storage';
import { MediaType } from '@prisma/client';

export const storyUploadController = {
  // POST /api/v1/story-upload/upload
  // Uploads file to stories/ in S3 and returns the proxy URL (no DB record yet).
  uploadMedia: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw ApiError.badRequest('No file provided');

    storyS3Service.validate({
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
  // Uploads file to stories/ in S3 AND creates the Story DB record atomically.
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
  // Proxies S3 objects so the bucket doesn't need public access.
  proxyMedia: asyncHandler(async (req: Request, res: Response) => {
    const key = decodeURIComponent(req.params['key'] as string);
    try {
      const command = new GetObjectCommand({ Bucket: storageBucket, Key: key });
      const s3Res = await s3.send(command);
      if (s3Res.ContentType) res.setHeader('Content-Type', s3Res.ContentType);
      if (s3Res.ContentLength) res.setHeader('Content-Length', s3Res.ContentLength);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      (s3Res.Body as Readable).pipe(res);
    } catch {
      throw ApiError.notFound('Story media not found');
    }
  }),
};

import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { ApiError } from '../utils/ApiError';

const STORY_ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/quicktime', 'video/avi', 'video/webm', 'video/x-msvideo',
]);

function storyFileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
  if (STORY_ALLOWED_TYPES.has(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new ApiError(415, `Unsupported story media type: ${file.mimetype}`));
  }
}

export const storyUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: storyFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

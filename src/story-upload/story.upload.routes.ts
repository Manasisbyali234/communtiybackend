import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { auth } from '../middleware/auth';
import { ApiError } from '../utils/ApiError';
import { storyUpload } from './story.upload.middleware';
import { storyUploadController } from './story.upload.controller';

const router = Router();

// Public proxy — no auth so <Image> / <video> tags load without a token
router.get('/proxy/:key(*)', storyUploadController.proxyMedia);

// Multer error → ApiError
function multerErrHandler(err: any, _req: Request, _res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    return next(new ApiError(400, `Story upload error: ${err.message}`));
  }
  next(err);
}

router.use(auth);

// Upload media only → returns S3 URL (frontend then calls POST /stories with the URL)
router.post(
  '/upload',
  storyUpload.single('file'),
  multerErrHandler,
  storyUploadController.uploadMedia
);

// Upload + create story in one request
router.post(
  '/create',
  storyUpload.single('file'),
  multerErrHandler,
  storyUploadController.uploadAndCreate
);

export default router;

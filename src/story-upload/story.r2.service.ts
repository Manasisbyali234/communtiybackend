import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2, storageBucket } from '../config/storage';
import { config } from '../config';
import { MAX_MEDIA_UPLOAD_SIZE, prepareMediaForUpload, UploadedFile } from '../services/media.service';

const STORY_FOLDER = 'stories';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/quicktime', 'video/avi', 'video/webm', 'video/x-msvideo',
]);

export type StoryFileInput = UploadedFile;

export interface StoryUploadResult {
  key: string;
  url: string;
}

function buildKey(originalname: string): string {
  const safe = originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${STORY_FOLDER}/${Date.now()}_${safe}`;
}

function proxyUrl(key: string): string {
  return `${config.APP_URL}/api/v1/story-upload/proxy/${encodeURIComponent(key)}`;
}

export const storyR2Service = {
  validate(file: StoryFileInput): void {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
      throw new Error(
        `Unsupported file type: ${file.mimetype}. Allowed: jpg, jpeg, png, webp, gif, mp4, mov, avi, webm`
      );
    }
    if (file.size > MAX_MEDIA_UPLOAD_SIZE) {
      throw new Error('File too large. Maximum size is 200MB.');
    }
  },

  async upload(file: StoryFileInput): Promise<StoryUploadResult> {
    storyR2Service.validate(file);
    const prepared = await prepareMediaForUpload(file);
    const key = buildKey(prepared.originalname);

    await r2.send(
      new PutObjectCommand({
        Bucket: storageBucket,
        Key: key,
        Body: prepared.buffer,
        ContentType: prepared.mimetype,
      })
    );

    return { key, url: proxyUrl(key) };
  },
};

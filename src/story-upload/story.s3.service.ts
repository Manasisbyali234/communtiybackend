import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3, storageBucket } from '../config/storage';
import { config } from '../config';

const STORY_FOLDER = 'stories';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/quicktime', 'video/avi', 'video/webm', 'video/x-msvideo',
]);

const MAX_SIZE_BYTES = 50 * 1024 * 1024;

export interface StoryFileInput {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface StoryUploadResult {
  key: string;
  url: string;
}

function buildKey(originalname: string): string {
  const ext = originalname.includes('.') ? originalname.split('.').pop()!.toLowerCase() : 'bin';
  const safe = originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${STORY_FOLDER}/${Date.now()}_${safe}`;
}

function proxyUrl(key: string): string {
  return `${config.APP_URL}/api/v1/story-upload/proxy/${encodeURIComponent(key)}`;
}

export const storyS3Service = {
  validate(file: StoryFileInput): void {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
      throw new Error(
        `Unsupported file type: ${file.mimetype}. Allowed: jpg, jpeg, png, webp, gif, mp4, mov, avi, webm`
      );
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error('File too large. Maximum size is 50MB.');
    }
  },

  async upload(file: StoryFileInput): Promise<StoryUploadResult> {
    storyS3Service.validate(file);
    const key = buildKey(file.originalname);

    await s3.send(
      new PutObjectCommand({
        Bucket: storageBucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    return { key, url: proxyUrl(key) };
  },
};

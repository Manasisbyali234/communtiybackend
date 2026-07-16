import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { config } from './index';

export const s3 = new S3Client({
  region: config.STORAGE_REGION!,
  credentials: {
    accessKeyId: config.STORAGE_ACCESS_KEY!,
    secretAccessKey: config.STORAGE_SECRET_KEY!,
  },
});

export const storageBucket = config.STORAGE_BUCKET!;
export const storagePublicUrl = config.STORAGE_PUBLIC_URL!;

export async function verifyS3Access(): Promise<void> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: storageBucket }));
    console.log(`✅ S3 bucket "${storageBucket}" accessible`);
  } catch (err: any) {
    console.warn(`⚠️  S3 bucket check failed (${err.name}: ${err.message}). Uploads may fail if bucket/credentials are incorrect.`);
  }
}

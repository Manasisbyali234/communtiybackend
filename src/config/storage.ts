import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { config } from './index';

function requireStorageValue(name: string, value?: string): string {
  if (!value) {
    throw new Error(`Missing required Cloudflare R2 environment variable: ${name}`);
  }
  return value;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

const r2Endpoint = stripTrailingSlash(requireStorageValue('R2_ENDPOINT', config.R2_ENDPOINT));
const r2AccessKeyId = requireStorageValue('R2_ACCESS_KEY_ID', config.R2_ACCESS_KEY_ID ?? config.STORAGE_ACCESS_KEY);
const r2SecretAccessKey = requireStorageValue('R2_SECRET_ACCESS_KEY', config.R2_SECRET_ACCESS_KEY ?? config.STORAGE_SECRET_KEY);

export const storageBucket = requireStorageValue('R2_BUCKET_NAME', config.R2_BUCKET_NAME ?? config.STORAGE_BUCKET);
export const storagePublicUrl = config.R2_PUBLIC_URL
  ? stripTrailingSlash(config.R2_PUBLIC_URL)
  : config.STORAGE_PUBLIC_URL
    ? stripTrailingSlash(config.STORAGE_PUBLIC_URL)
    : undefined;

export const r2 = new S3Client({
  region: config.R2_REGION ?? config.STORAGE_REGION ?? 'auto',
  endpoint: r2Endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey,
  },
});

export async function verifyR2Access(): Promise<void> {
  try {
    await r2.send(new HeadBucketCommand({ Bucket: storageBucket }));
    console.log(`Cloudflare R2 bucket "${storageBucket}" accessible`);
  } catch (err: any) {
    console.warn(`Cloudflare R2 bucket check failed (${err.name}: ${err.message}). Uploads may fail if bucket/credentials are incorrect.`);
  }
}

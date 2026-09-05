import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { r2, storageBucket } from '../config/storage';
import { config } from '../config';

// Serve files through the backend proxy so the R2 bucket doesn't need public access.
const proxyUrl = (key: string) => `${config.APP_URL}/api/v1/media/proxy/${encodeURIComponent(key)}`;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3',
  'application/pdf', 'text/plain',
]);

export const MAX_MEDIA_UPLOAD_SIZE = 200 * 1024 * 1024;
export const MAX_LOGO_UPLOAD_SIZE = 10 * 1024 * 1024;

export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

const JPEG_MIME_TYPES = new Set(['image/jpeg', 'image/jpg']);

export async function prepareImageForUpload(file: UploadedFile): Promise<UploadedFile> {
  if (!JPEG_MIME_TYPES.has(file.mimetype.toLowerCase())) return file;

  try {
    const buffer = await sharp(file.buffer)
      .rotate()
      .resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    return {
      ...file,
      buffer,
      size: buffer.length,
      mimetype: 'image/webp',
      originalname: file.originalname.replace(/\.(jpe?g)$/i, '.webp') || `${file.originalname}.webp`,
    };
  } catch {
    throw ApiError.badRequest('Could not process image upload.');
  }
}

const assertMaxUploadSize = (file: UploadedFile) => {
  if (file.size > MAX_MEDIA_UPLOAD_SIZE) {
    throw ApiError.badRequest('File too large. Maximum size is 200MB.');
  }
};

const fileExtension = (file: UploadedFile, fallback = '') => path.extname(file.originalname) || fallback;

export const mediaService = {
  async uploadFile(file: UploadedFile, uploadedBy: string): Promise<{ id: string; filename: string; url: string }> {
    assertMaxUploadSize(file);
    if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) throw ApiError.badRequest('File type not allowed.');

    const prepared = await prepareImageForUpload(file);
    const extension = fileExtension(prepared);
    const filename = `${crypto.randomUUID()}${extension}`;
    const key = `uploads/${filename}`;

    return this._uploadToStorage(prepared, key, uploadedBy);
  },

  async uploadEventImage(file: UploadedFile, uploadedBy: string): Promise<{ id: string; filename: string; url: string }> {
    assertMaxUploadSize(file);
    if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) throw ApiError.badRequest('File type not allowed.');

    const prepared = await prepareImageForUpload(file);
    const extension = fileExtension(prepared);
    const filename = `${crypto.randomUUID()}${extension}`;
    const key = `events/${filename}`;

    await r2.send(new PutObjectCommand({
      Bucket: storageBucket,
      Key: key,
      Body: prepared.buffer,
      ContentType: prepared.mimetype,
    }));

    // Store a relative proxy URL so any client IP resolves it correctly via toAbs()
    const url = `/api/v1/media/proxy/${encodeURIComponent(key)}`;

    console.log('[uploadEventImage] R2 key:', key, '| db url:', url);

    const mediaFile = await prisma.mediaFile.create({
      data: { filename: key, originalName: prepared.originalname, mimeType: prepared.mimetype, fileSize: prepared.size, url, uploadedBy },
    });

    return { id: mediaFile.id, filename: key, url };
  },

  async uploadCommunityImage(file: UploadedFile, uploadedBy: string): Promise<{ id: string; filename: string; url: string }> {
    assertMaxUploadSize(file);
    if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase()) || !file.mimetype.toLowerCase().startsWith('image/')) {
      throw ApiError.badRequest('Only supported image files can be used for a community.');
    }

    const prepared = await prepareImageForUpload(file);
    const extension = fileExtension(prepared, '.jpg');
    const key = `communities/${uploadedBy}/${crypto.randomUUID()}${extension}`;
    return this._uploadToStorage(prepared, key, uploadedBy);
  },

  async uploadProfilePhoto(file: UploadedFile, uploadedBy: string): Promise<{ id: string; filename: string; url: string }> {
    assertMaxUploadSize(file);
    if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) throw ApiError.badRequest('File type not allowed.');

    const prepared = await prepareImageForUpload(file);
    const extension = fileExtension(prepared, '.jpg');
    const key = `profile/profile-photo-${uploadedBy}-${Date.now()}${extension}`;

    return this._uploadProfileToStorage(prepared, key, uploadedBy);
  },

  async uploadCoverPhoto(file: UploadedFile, uploadedBy: string): Promise<{ id: string; filename: string; url: string }> {
    assertMaxUploadSize(file);
    if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) throw ApiError.badRequest('File type not allowed.');

    const prepared = await prepareImageForUpload(file);
    const extension = fileExtension(prepared, '.jpg');
    const key = `profile/cover-photo-${uploadedBy}-${Date.now()}${extension}`;

    return this._uploadProfileToStorage(prepared, key, uploadedBy);
  },

  async uploadChatFile(file: UploadedFile, uploadedBy: string): Promise<{ id: string; filename: string; url: string; key: string; originalName: string; mimeType: string; fileSize: number }> {
    assertMaxUploadSize(file);

    const normalizedMime = file.mimetype.toLowerCase();
    const CHAT_ALLOWED = new Set([
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/heic', 'image/heif',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/x-matroska',
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3',
      'application/pdf', 'text/plain', 'text/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ]);
    if (!CHAT_ALLOWED.has(normalizedMime)) throw ApiError.badRequest('File type not allowed.');

    const prepared = await prepareImageForUpload(file);
    const extension = fileExtension(prepared);
    const filename = `${crypto.randomUUID()}${extension}`;
    const key = `chat/${filename}`;

    await r2.send(new PutObjectCommand({
      Bucket: storageBucket,
      Key: key,
      Body: prepared.buffer,
      ContentType: prepared.mimetype,
    }));

    // Store relative proxy URL so it resolves correctly from any client IP
    const url = `/api/v1/media/proxy/${encodeURIComponent(key)}`;

    const mediaFile = await prisma.mediaFile.create({
      data: { filename: key, originalName: prepared.originalname, mimeType: prepared.mimetype, fileSize: prepared.size, url, uploadedBy },
    });

    return {
      id: mediaFile.id,
      filename: key,
      key,
      url,
      originalName: prepared.originalname,
      mimeType: prepared.mimetype,
      fileSize: prepared.size,
    };
  },

  async uploadPostImage(file: UploadedFile, uploadedBy: string): Promise<{ id: string; filename: string; url: string }> {
    assertMaxUploadSize(file);
    if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) throw ApiError.badRequest('File type not allowed.');

    const prepared = await prepareImageForUpload(file);
    const extension = fileExtension(prepared, '.jpg');
    const key = `feed/post-${uploadedBy}-${Date.now()}${extension}`;

    return this._uploadToStorage(prepared, key, uploadedBy);
  },

  async uploadPostVideo(file: UploadedFile, uploadedBy: string): Promise<{ id: string; filename: string; url: string; mimeType: string; fileSize: number }> {
    const VIDEO_MIME_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']);
    const EXECUTABLE_TYPES = new Set(['application/x-msdownload', 'application/x-executable', 'application/x-sh']);

    if (EXECUTABLE_TYPES.has(file.mimetype.toLowerCase())) throw ApiError.badRequest('Executable files are not allowed.');
    if (!VIDEO_MIME_TYPES.has(file.mimetype.toLowerCase())) throw ApiError.badRequest('Unsupported video format. Allowed: MP4, MOV, AVI, WebM.');
    if (file.size > MAX_MEDIA_UPLOAD_SIZE) throw ApiError.badRequest('Maximum video size allowed is 200 MB.');

    const extension = path.extname(file.originalname) || '.mp4';
    const filename = `video-${crypto.randomUUID()}${extension}`;
    const key = `feed/${filename}`;

    await r2.send(new PutObjectCommand({
      Bucket: storageBucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    const url = `/api/v1/media/proxy/${encodeURIComponent(key)}`;

    const mediaFile = await prisma.mediaFile.create({
      data: { filename: key, originalName: file.originalname, mimeType: file.mimetype, fileSize: file.size, url, uploadedBy },
    });

    return { id: mediaFile.id, filename: key, url, mimeType: file.mimetype, fileSize: file.size };
  },

  // Profile images use a relative proxy path so any client IP can resolve them correctly.
  // The frontend's toAbs() in authStore prepends the correct base URL at runtime.
  async _uploadProfileToStorage(file: UploadedFile, key: string, uploadedBy: string): Promise<{ id: string; filename: string; url: string }> {
    await r2.send(new PutObjectCommand({
      Bucket: storageBucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    // Store a relative URL — frontend prepends the correct host via toAbs()
    const url = `/api/v1/media/proxy/${encodeURIComponent(key)}`;

    const mediaFile = await prisma.mediaFile.create({
      data: { filename: key, originalName: file.originalname, mimeType: file.mimetype, fileSize: file.size, url, uploadedBy },
    });

    return { id: mediaFile.id, filename: key, url };
  },

  async _uploadToStorage(file: UploadedFile, key: string, uploadedBy: string): Promise<{ id: string; filename: string; url: string }> {

    await r2.send(new PutObjectCommand({
      Bucket: storageBucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    // Store a relative URL so any client IP resolves it correctly via toAbs()
    const url = `/api/v1/media/proxy/${encodeURIComponent(key)}`;

    const mediaFile = await prisma.mediaFile.create({
      data: { filename: key, originalName: file.originalname, mimeType: file.mimetype, fileSize: file.size, url, uploadedBy },
    });

    return { id: mediaFile.id, filename: key, url };
  },

  async uploadFiles(files: UploadedFile[], uploadedBy: string) {
    return Promise.all(files.map(f => this.uploadFile(f, uploadedBy)));
  },

  async getFile(id: string) {
    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id },
      select: { url: true, mimeType: true, filename: true, originalName: true },
    });
    return mediaFile ?? null;
  },

  async deleteFile(id: string, userId?: string): Promise<void> {
    const where: any = { id };
    if (userId) where.uploadedBy = userId;

    const file = await prisma.mediaFile.findFirst({ where, select: { id: true, filename: true } });
    if (!file) throw ApiError.notFound('File not found or you do not have permission to delete it.');

    await r2.send(new DeleteObjectCommand({ Bucket: storageBucket, Key: file.filename }));
    await prisma.mediaFile.delete({ where: { id } });
  },

  async getFileMetadata(id: string) {
    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id },
      select: { id: true, filename: true, originalName: true, mimeType: true, fileSize: true, uploadedBy: true, createdAt: true, url: true },
    });
    return mediaFile ?? null;
  },

  async getUserFiles(userId: string, { skip, take, mimeType }: { skip: number; take: number; mimeType?: string }) {
    const where: any = { uploadedBy: userId };
    if (mimeType) where.mimeType = { startsWith: mimeType };

    const [files, total] = await Promise.all([
      prisma.mediaFile.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.mediaFile.count({ where }),
    ]);

    return { files, total };
  },

  async getStorageStats() {
    const stats = await prisma.mediaFile.aggregate({
      _count: { id: true },
      _sum: { fileSize: true },
    });
    return { totalFiles: stats._count.id, totalSize: stats._sum.fileSize ?? 0 };
  },
};

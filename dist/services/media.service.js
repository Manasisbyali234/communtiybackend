"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaService = void 0;
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const client_s3_1 = require("@aws-sdk/client-s3");
const database_1 = require("../config/database");
const ApiError_1 = require("../utils/ApiError");
const storage_1 = require("../config/storage");
const config_1 = require("../config");
// Serve images through the backend proxy so S3 bucket doesn't need public access
const proxyUrl = (key) => `${config_1.config.APP_URL}/api/v1/media/proxy/${encodeURIComponent(key)}`;
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3',
    'application/pdf', 'text/plain',
]);
const MAX_SIZE = 50 * 1024 * 1024;
exports.mediaService = {
    async uploadFile(file, uploadedBy) {
        if (file.size > MAX_SIZE)
            throw ApiError_1.ApiError.badRequest('File too large. Maximum size is 50MB.');
        if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase()))
            throw ApiError_1.ApiError.badRequest('File type not allowed.');
        const extension = path_1.default.extname(file.originalname);
        const filename = `${crypto_1.default.randomUUID()}${extension}`;
        const key = `uploads/${filename}`;
        return this._uploadToS3(file, key, uploadedBy);
    },
    async uploadEventImage(file, uploadedBy) {
        if (file.size > MAX_SIZE)
            throw ApiError_1.ApiError.badRequest('File too large. Maximum size is 50MB.');
        if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase()))
            throw ApiError_1.ApiError.badRequest('File type not allowed.');
        const extension = path_1.default.extname(file.originalname);
        const filename = `${crypto_1.default.randomUUID()}${extension}`;
        const key = `events/${filename}`;
        await storage_1.s3.send(new client_s3_1.PutObjectCommand({
            Bucket: storage_1.storageBucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        }));
        // Store a relative proxy URL so any client IP resolves it correctly via toAbs()
        const url = `/api/v1/media/proxy/${encodeURIComponent(key)}`;
        console.log('[uploadEventImage] S3 key:', key, '| db url:', url);
        const mediaFile = await database_1.prisma.mediaFile.create({
            data: { filename: key, originalName: file.originalname, mimeType: file.mimetype, fileSize: file.size, url, uploadedBy },
        });
        return { id: mediaFile.id, filename: key, url };
    },
    async uploadCommunityImage(file, uploadedBy) {
        if (file.size > MAX_SIZE)
            throw ApiError_1.ApiError.badRequest('File too large. Maximum size is 50MB.');
        if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase()) || !file.mimetype.toLowerCase().startsWith('image/')) {
            throw ApiError_1.ApiError.badRequest('Only supported image files can be used for a community.');
        }
        const extension = path_1.default.extname(file.originalname) || '.jpg';
        const key = `communities/${uploadedBy}/${crypto_1.default.randomUUID()}${extension}`;
        return this._uploadToS3(file, key, uploadedBy);
    },
    async uploadProfilePhoto(file, uploadedBy) {
        if (file.size > MAX_SIZE)
            throw ApiError_1.ApiError.badRequest('File too large. Maximum size is 50MB.');
        if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase()))
            throw ApiError_1.ApiError.badRequest('File type not allowed.');
        const extension = path_1.default.extname(file.originalname) || '.jpg';
        const key = `profile/profile-photo-${uploadedBy}-${Date.now()}${extension}`;
        return this._uploadProfileToS3(file, key, uploadedBy);
    },
    async uploadCoverPhoto(file, uploadedBy) {
        if (file.size > MAX_SIZE)
            throw ApiError_1.ApiError.badRequest('File too large. Maximum size is 50MB.');
        if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase()))
            throw ApiError_1.ApiError.badRequest('File type not allowed.');
        const extension = path_1.default.extname(file.originalname) || '.jpg';
        const key = `profile/cover-photo-${uploadedBy}-${Date.now()}${extension}`;
        return this._uploadProfileToS3(file, key, uploadedBy);
    },
    async uploadChatFile(file, uploadedBy) {
        if (file.size > MAX_SIZE)
            throw ApiError_1.ApiError.badRequest('File too large. Maximum size is 50MB.');
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
        if (!CHAT_ALLOWED.has(normalizedMime))
            throw ApiError_1.ApiError.badRequest('File type not allowed.');
        const extension = path_1.default.extname(file.originalname) || '';
        const filename = `${crypto_1.default.randomUUID()}${extension}`;
        const key = `chat/${filename}`;
        await storage_1.s3.send(new client_s3_1.PutObjectCommand({
            Bucket: storage_1.storageBucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        }));
        // Store relative proxy URL so it resolves correctly from any client IP
        const url = `/api/v1/media/proxy/${encodeURIComponent(key)}`;
        const mediaFile = await database_1.prisma.mediaFile.create({
            data: { filename: key, originalName: file.originalname, mimeType: file.mimetype, fileSize: file.size, url, uploadedBy },
        });
        return {
            id: mediaFile.id,
            filename: key,
            key,
            url,
            originalName: file.originalname,
            mimeType: file.mimetype,
            fileSize: file.size,
        };
    },
    async uploadPostImage(file, uploadedBy) {
        if (file.size > MAX_SIZE)
            throw ApiError_1.ApiError.badRequest('File too large. Maximum size is 50MB.');
        if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase()))
            throw ApiError_1.ApiError.badRequest('File type not allowed.');
        const extension = path_1.default.extname(file.originalname) || '.jpg';
        const key = `feed/post-${uploadedBy}-${Date.now()}${extension}`;
        return this._uploadToS3(file, key, uploadedBy);
    },
    async uploadPostVideo(file, uploadedBy) {
        const VIDEO_MIME_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']);
        const EXECUTABLE_TYPES = new Set(['application/x-msdownload', 'application/x-executable', 'application/x-sh']);
        if (EXECUTABLE_TYPES.has(file.mimetype.toLowerCase()))
            throw ApiError_1.ApiError.badRequest('Executable files are not allowed.');
        if (!VIDEO_MIME_TYPES.has(file.mimetype.toLowerCase()))
            throw ApiError_1.ApiError.badRequest('Unsupported video format. Allowed: MP4, MOV, AVI, WebM.');
        if (file.size > MAX_SIZE)
            throw ApiError_1.ApiError.badRequest('Maximum video size allowed is 50 MB.');
        const extension = path_1.default.extname(file.originalname) || '.mp4';
        const filename = `video-${crypto_1.default.randomUUID()}${extension}`;
        const key = `feed/${filename}`;
        await storage_1.s3.send(new client_s3_1.PutObjectCommand({
            Bucket: storage_1.storageBucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        }));
        const url = `/api/v1/media/proxy/${encodeURIComponent(key)}`;
        const mediaFile = await database_1.prisma.mediaFile.create({
            data: { filename: key, originalName: file.originalname, mimeType: file.mimetype, fileSize: file.size, url, uploadedBy },
        });
        return { id: mediaFile.id, filename: key, url, mimeType: file.mimetype, fileSize: file.size };
    },
    // Profile images use a relative proxy path so any client IP can resolve them correctly.
    // The frontend's toAbs() in authStore prepends the correct base URL at runtime.
    async _uploadProfileToS3(file, key, uploadedBy) {
        await storage_1.s3.send(new client_s3_1.PutObjectCommand({
            Bucket: storage_1.storageBucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        }));
        // Store a relative URL — frontend prepends the correct host via toAbs()
        const url = `/api/v1/media/proxy/${encodeURIComponent(key)}`;
        const mediaFile = await database_1.prisma.mediaFile.create({
            data: { filename: key, originalName: file.originalname, mimeType: file.mimetype, fileSize: file.size, url, uploadedBy },
        });
        return { id: mediaFile.id, filename: key, url };
    },
    async _uploadToS3(file, key, uploadedBy) {
        await storage_1.s3.send(new client_s3_1.PutObjectCommand({
            Bucket: storage_1.storageBucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        }));
        // Store a relative URL so any client IP resolves it correctly via toAbs()
        const url = `/api/v1/media/proxy/${encodeURIComponent(key)}`;
        const mediaFile = await database_1.prisma.mediaFile.create({
            data: { filename: key, originalName: file.originalname, mimeType: file.mimetype, fileSize: file.size, url, uploadedBy },
        });
        return { id: mediaFile.id, filename: key, url };
    },
    async uploadFiles(files, uploadedBy) {
        return Promise.all(files.map(f => this.uploadFile(f, uploadedBy)));
    },
    async getFile(id) {
        const mediaFile = await database_1.prisma.mediaFile.findUnique({
            where: { id },
            select: { url: true, mimeType: true, filename: true, originalName: true },
        });
        return mediaFile ?? null;
    },
    async deleteFile(id, userId) {
        const where = { id };
        if (userId)
            where.uploadedBy = userId;
        const file = await database_1.prisma.mediaFile.findFirst({ where, select: { id: true, filename: true } });
        if (!file)
            throw ApiError_1.ApiError.notFound('File not found or you do not have permission to delete it.');
        await storage_1.s3.send(new client_s3_1.DeleteObjectCommand({ Bucket: storage_1.storageBucket, Key: file.filename }));
        await database_1.prisma.mediaFile.delete({ where: { id } });
    },
    async getFileMetadata(id) {
        const mediaFile = await database_1.prisma.mediaFile.findUnique({
            where: { id },
            select: { id: true, filename: true, originalName: true, mimeType: true, fileSize: true, uploadedBy: true, createdAt: true, url: true },
        });
        return mediaFile ?? null;
    },
    async getUserFiles(userId, { skip, take, mimeType }) {
        const where = { uploadedBy: userId };
        if (mimeType)
            where.mimeType = { startsWith: mimeType };
        const [files, total] = await Promise.all([
            database_1.prisma.mediaFile.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
            database_1.prisma.mediaFile.count({ where }),
        ]);
        return { files, total };
    },
    async getStorageStats() {
        const stats = await database_1.prisma.mediaFile.aggregate({
            _count: { id: true },
            _sum: { fileSize: true },
        });
        return { totalFiles: stats._count.id, totalSize: stats._sum.fileSize ?? 0 };
    },
};
//# sourceMappingURL=media.service.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaService = exports.MAX_LOGO_UPLOAD_SIZE = exports.MAX_MEDIA_UPLOAD_SIZE = void 0;
exports.prepareImageForUpload = prepareImageForUpload;
exports.prepareVideoForUpload = prepareVideoForUpload;
exports.prepareMediaForUpload = prepareMediaForUpload;
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const child_process_1 = require("child_process");
const promises_1 = require("fs/promises");
const os_1 = require("os");
const ffmpeg_static_1 = __importDefault(require("ffmpeg-static"));
const sharp_1 = __importDefault(require("sharp"));
const client_s3_1 = require("@aws-sdk/client-s3");
const database_1 = require("../config/database");
const ApiError_1 = require("../utils/ApiError");
const storage_1 = require("../config/storage");
const config_1 = require("../config");
// Serve files through the backend proxy so the R2 bucket doesn't need public access.
const proxyUrl = (key) => `${config_1.config.APP_URL}/api/v1/media/proxy/${encodeURIComponent(key)}`;
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/x-matroska', 'video/avi',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3',
    'application/pdf', 'text/plain',
]);
exports.MAX_MEDIA_UPLOAD_SIZE = 200 * 1024 * 1024;
exports.MAX_LOGO_UPLOAD_SIZE = 10 * 1024 * 1024;
const JPEG_MIME_TYPES = new Set(['image/jpeg', 'image/jpg']);
const VIDEO_MIME_TYPES = new Set([
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/webm',
    'video/x-msvideo',
    'video/x-matroska',
    'video/avi',
]);
async function prepareImageForUpload(file) {
    if (!JPEG_MIME_TYPES.has(file.mimetype.toLowerCase()))
        return file;
    try {
        const buffer = await (0, sharp_1.default)(file.buffer)
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
    }
    catch {
        throw ApiError_1.ApiError.badRequest('Could not process image upload.');
    }
}
function runFfmpeg(args) {
    if (!ffmpeg_static_1.default) {
        throw ApiError_1.ApiError.internal('Video compression is not available on this server.');
    }
    return new Promise((resolve, reject) => {
        const child = (0, child_process_1.spawn)(ffmpeg_static_1.default, args, { windowsHide: true });
        let stderr = '';
        child.stderr.on('data', (chunk) => {
            if (stderr.length < 4000)
                stderr += chunk.toString();
        });
        child.on('error', reject);
        child.on('close', (code) => {
            if (code === 0)
                resolve();
            else
                reject(new Error(stderr || `ffmpeg exited with code ${code}`));
        });
    });
}
async function prepareVideoForUpload(file) {
    if (!VIDEO_MIME_TYPES.has(file.mimetype.toLowerCase()))
        return file;
    assertMaxUploadSize(file);
    const tempDir = await (0, promises_1.mkdtemp)(path_1.default.join((0, os_1.tmpdir)(), 'community-media-'));
    const inputPath = path_1.default.join(tempDir, `input${path_1.default.extname(file.originalname) || '.video'}`);
    const outputPath = path_1.default.join(tempDir, 'output.mp4');
    try {
        await (0, promises_1.writeFile)(inputPath, file.buffer);
        await runFfmpeg([
            '-y',
            '-i', inputPath,
            '-vf', 'scale=min(1280\\,iw):-2',
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-crf', '28',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            outputPath,
        ]);
        const outputStats = await (0, promises_1.stat)(outputPath);
        if (outputStats.size > exports.MAX_MEDIA_UPLOAD_SIZE) {
            throw ApiError_1.ApiError.badRequest('Compressed video is still too large. Maximum size is 200MB.');
        }
        if (outputStats.size >= file.size && file.mimetype.toLowerCase() === 'video/mp4') {
            return file;
        }
        const buffer = await (0, promises_1.readFile)(outputPath);
        return {
            ...file,
            buffer,
            size: buffer.length,
            mimetype: 'video/mp4',
            originalname: file.originalname.replace(/\.[^.]+$/i, '.mp4') || `${file.originalname}.mp4`,
        };
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw ApiError_1.ApiError.badRequest('Could not process video upload.');
    }
    finally {
        await (0, promises_1.rm)(tempDir, { recursive: true, force: true });
    }
}
async function prepareMediaForUpload(file) {
    if (file.mimetype.toLowerCase().startsWith('image/'))
        return prepareImageForUpload(file);
    if (VIDEO_MIME_TYPES.has(file.mimetype.toLowerCase()))
        return prepareVideoForUpload(file);
    return file;
}
const assertMaxUploadSize = (file) => {
    if (file.size > exports.MAX_MEDIA_UPLOAD_SIZE) {
        throw ApiError_1.ApiError.badRequest('File too large. Maximum size is 200MB.');
    }
};
const fileExtension = (file, fallback = '') => path_1.default.extname(file.originalname) || fallback;
exports.mediaService = {
    async uploadFile(file, uploadedBy) {
        assertMaxUploadSize(file);
        if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase()))
            throw ApiError_1.ApiError.badRequest('File type not allowed.');
        const prepared = await prepareMediaForUpload(file);
        const extension = fileExtension(prepared);
        const filename = `${crypto_1.default.randomUUID()}${extension}`;
        const key = `uploads/${filename}`;
        return this._uploadToStorage(prepared, key, uploadedBy);
    },
    async uploadEventImage(file, uploadedBy) {
        assertMaxUploadSize(file);
        if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase()))
            throw ApiError_1.ApiError.badRequest('File type not allowed.');
        const prepared = await prepareMediaForUpload(file);
        const extension = fileExtension(prepared);
        const filename = `${crypto_1.default.randomUUID()}${extension}`;
        const key = `events/${filename}`;
        await storage_1.r2.send(new client_s3_1.PutObjectCommand({
            Bucket: storage_1.storageBucket,
            Key: key,
            Body: prepared.buffer,
            ContentType: prepared.mimetype,
        }));
        // Store a relative proxy URL so any client IP resolves it correctly via toAbs()
        const url = `/api/v1/media/proxy/${encodeURIComponent(key)}`;
        console.log('[uploadEventImage] R2 key:', key, '| db url:', url);
        const mediaFile = await database_1.prisma.mediaFile.create({
            data: { filename: key, originalName: prepared.originalname, mimeType: prepared.mimetype, fileSize: prepared.size, url, uploadedBy },
        });
        return { id: mediaFile.id, filename: key, url };
    },
    async uploadCommunityImage(file, uploadedBy) {
        assertMaxUploadSize(file);
        if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase()) || !file.mimetype.toLowerCase().startsWith('image/')) {
            throw ApiError_1.ApiError.badRequest('Only supported image files can be used for a community.');
        }
        const prepared = await prepareImageForUpload(file);
        const extension = fileExtension(prepared, '.jpg');
        const key = `communities/${uploadedBy}/${crypto_1.default.randomUUID()}${extension}`;
        return this._uploadToStorage(prepared, key, uploadedBy);
    },
    async uploadProfilePhoto(file, uploadedBy) {
        assertMaxUploadSize(file);
        if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase()))
            throw ApiError_1.ApiError.badRequest('File type not allowed.');
        const prepared = await prepareImageForUpload(file);
        const extension = fileExtension(prepared, '.jpg');
        const key = `profile/profile-photo-${uploadedBy}-${Date.now()}${extension}`;
        return this._uploadProfileToStorage(prepared, key, uploadedBy);
    },
    async uploadCoverPhoto(file, uploadedBy) {
        assertMaxUploadSize(file);
        if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase()))
            throw ApiError_1.ApiError.badRequest('File type not allowed.');
        const prepared = await prepareImageForUpload(file);
        const extension = fileExtension(prepared, '.jpg');
        const key = `profile/cover-photo-${uploadedBy}-${Date.now()}${extension}`;
        return this._uploadProfileToStorage(prepared, key, uploadedBy);
    },
    async uploadChatFile(file, uploadedBy) {
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
        if (!CHAT_ALLOWED.has(normalizedMime))
            throw ApiError_1.ApiError.badRequest('File type not allowed.');
        const prepared = await prepareImageForUpload(file);
        const extension = fileExtension(prepared);
        const filename = `${crypto_1.default.randomUUID()}${extension}`;
        const key = `chat/${filename}`;
        await storage_1.r2.send(new client_s3_1.PutObjectCommand({
            Bucket: storage_1.storageBucket,
            Key: key,
            Body: prepared.buffer,
            ContentType: prepared.mimetype,
        }));
        // Store relative proxy URL so it resolves correctly from any client IP
        const url = `/api/v1/media/proxy/${encodeURIComponent(key)}`;
        const mediaFile = await database_1.prisma.mediaFile.create({
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
    async uploadPostImage(file, uploadedBy) {
        assertMaxUploadSize(file);
        if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase()))
            throw ApiError_1.ApiError.badRequest('File type not allowed.');
        const prepared = await prepareImageForUpload(file);
        const extension = fileExtension(prepared, '.jpg');
        const key = `feed/post-${uploadedBy}-${Date.now()}${extension}`;
        return this._uploadToStorage(prepared, key, uploadedBy);
    },
    async uploadPostVideo(file, uploadedBy) {
        const EXECUTABLE_TYPES = new Set(['application/x-msdownload', 'application/x-executable', 'application/x-sh']);
        if (EXECUTABLE_TYPES.has(file.mimetype.toLowerCase()))
            throw ApiError_1.ApiError.badRequest('Executable files are not allowed.');
        if (!VIDEO_MIME_TYPES.has(file.mimetype.toLowerCase()))
            throw ApiError_1.ApiError.badRequest('Unsupported video format. Allowed: MP4, MOV, AVI, WebM.');
        assertMaxUploadSize(file);
        const prepared = await prepareVideoForUpload(file);
        const extension = fileExtension(prepared, '.mp4');
        const filename = `video-${crypto_1.default.randomUUID()}${extension}`;
        const key = `feed/${filename}`;
        await storage_1.r2.send(new client_s3_1.PutObjectCommand({
            Bucket: storage_1.storageBucket,
            Key: key,
            Body: prepared.buffer,
            ContentType: prepared.mimetype,
        }));
        const url = `/api/v1/media/proxy/${encodeURIComponent(key)}`;
        const mediaFile = await database_1.prisma.mediaFile.create({
            data: { filename: key, originalName: prepared.originalname, mimeType: prepared.mimetype, fileSize: prepared.size, url, uploadedBy },
        });
        return { id: mediaFile.id, filename: key, url, mimeType: prepared.mimetype, fileSize: prepared.size };
    },
    // Profile images use a relative proxy path so any client IP can resolve them correctly.
    // The frontend's toAbs() in authStore prepends the correct base URL at runtime.
    async _uploadProfileToStorage(file, key, uploadedBy) {
        await storage_1.r2.send(new client_s3_1.PutObjectCommand({
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
    async _uploadToStorage(file, key, uploadedBy) {
        await storage_1.r2.send(new client_s3_1.PutObjectCommand({
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
        await storage_1.r2.send(new client_s3_1.DeleteObjectCommand({ Bucket: storage_1.storageBucket, Key: file.filename }));
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
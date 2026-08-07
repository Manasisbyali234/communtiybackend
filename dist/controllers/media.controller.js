"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaController = exports.uploadMultipleMiddleware = exports.uploadMiddleware = void 0;
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const asyncHandler_1 = require("../utils/asyncHandler");
const media_service_1 = require("../services/media.service");
const upload_1 = require("../middleware/upload");
const client_s3_1 = require("@aws-sdk/client-s3");
const storage_1 = require("../config/storage");
exports.uploadMiddleware = upload_1.upload.single('file');
exports.uploadMultipleMiddleware = upload_1.upload.array('files', 10);
exports.mediaController = {
    uploadEventImage: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        if (!req.file)
            throw ApiError_1.ApiError.badRequest('No file provided');
        const result = await media_service_1.mediaService.uploadEventImage({ buffer: req.file.buffer, originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size }, req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, result, 'Event image uploaded successfully'));
    }),
    uploadProfilePhoto: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        if (!req.file)
            throw ApiError_1.ApiError.badRequest('No file provided');
        const result = await media_service_1.mediaService.uploadProfilePhoto({ buffer: req.file.buffer, originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size }, req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, result, 'Profile photo uploaded successfully'));
    }),
    uploadCoverPhoto: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        if (!req.file)
            throw ApiError_1.ApiError.badRequest('No file provided');
        const result = await media_service_1.mediaService.uploadCoverPhoto({ buffer: req.file.buffer, originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size }, req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, result, 'Cover photo uploaded successfully'));
    }),
    uploadPostImage: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        if (!req.file)
            throw ApiError_1.ApiError.badRequest('No file provided');
        const result = await media_service_1.mediaService.uploadPostImage({ buffer: req.file.buffer, originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size }, req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, result, 'Post image uploaded successfully'));
    }),
    uploadPostVideo: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        if (!req.file)
            throw ApiError_1.ApiError.badRequest('No file provided');
        const result = await media_service_1.mediaService.uploadPostVideo({ buffer: req.file.buffer, originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size }, req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, result, 'Post video uploaded successfully'));
    }),
    uploadChatFile: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        if (!req.file)
            throw ApiError_1.ApiError.badRequest('No file provided');
        const result = await media_service_1.mediaService.uploadChatFile({ buffer: req.file.buffer, originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size }, req.user.id);
        console.log('[upload-chat] result:', JSON.stringify(result));
        res.json(new ApiResponse_1.ApiResponse(200, result, 'Chat file uploaded successfully'));
    }),
    upload: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        console.log('[upload] request received', req.method, req.url);
        console.log('[upload] headers', JSON.stringify(req.headers));
        console.log('[upload] body', req.body);
        console.log('[upload] req.file', req.file
            ? { fieldname: req.file.fieldname, originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size }
            : undefined);
        if (!req.file) {
            throw ApiError_1.ApiError.badRequest('No file provided');
        }
        console.log('[upload] calling mediaService.uploadFile');
        let result;
        try {
            result = await media_service_1.mediaService.uploadFile({
                buffer: req.file.buffer,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
            }, req.user.id);
        }
        catch (err) {
            console.error('[upload] mediaService.uploadFile threw:', err);
            console.error('[upload] stack:', err?.stack);
            throw err;
        }
        console.log('[upload] mediaService.uploadFile succeeded', result);
        res.json(new ApiResponse_1.ApiResponse(200, result, 'File uploaded successfully'));
    }),
    uploadMultiple: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            throw ApiError_1.ApiError.badRequest('No files provided');
        }
        const files = req.files.map(file => ({
            buffer: file.buffer,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
        }));
        const results = await media_service_1.mediaService.uploadFiles(files, req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, { files: results }, 'Files uploaded successfully'));
    }),
    getFile: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const file = await media_service_1.mediaService.getFile(id);
        if (!file) {
            throw ApiError_1.ApiError.notFound('File not found');
        }
        res.redirect(file.url);
    }),
    // Proxy S3 object by key — avoids needing public bucket access
    proxyFile: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const raw = req.params['key'];
        // Support both encoded (feed%2Ffile.jpg) and decoded (feed/file.jpg) keys
        const key = raw.includes('%') ? decodeURIComponent(raw) : raw;
        try {
            const command = new client_s3_1.GetObjectCommand({ Bucket: storage_1.storageBucket, Key: key });
            const s3Res = await storage_1.s3.send(command);
            if (s3Res.ContentType)
                res.setHeader('Content-Type', s3Res.ContentType);
            if (s3Res.ContentLength)
                res.setHeader('Content-Length', s3Res.ContentLength);
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            const stream = s3Res.Body;
            stream.on('error', (err) => {
                console.error('[proxyFile] stream error for key:', key, err.message);
                if (!res.headersSent)
                    res.status(500).end();
            });
            stream.pipe(res);
        }
        catch (err) {
            console.error('[proxyFile] S3 error for key:', key, err?.name, err?.message);
            throw ApiError_1.ApiError.notFound('File not found');
        }
    }),
    getFileMetadata: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const metadata = await media_service_1.mediaService.getFileMetadata(id);
        if (!metadata) {
            throw ApiError_1.ApiError.notFound('File not found');
        }
        res.json(new ApiResponse_1.ApiResponse(200, metadata));
    }),
    getUserFiles: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { page = '1', limit = '20', mimeType } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
        const result = await media_service_1.mediaService.getUserFiles(req.user.id, {
            skip,
            take,
            mimeType: mimeType,
        });
        res.json(new ApiResponse_1.ApiResponse(200, {
            files: result.files,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: result.total,
                totalPages: Math.ceil(result.total / take),
            },
        }));
    }),
    deleteFile: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        await media_service_1.mediaService.deleteFile(id, req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'File deleted successfully'));
    }),
    getStorageStats: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        // Only allow admins to view storage stats
        if (req.user.role !== 'ADMIN') {
            throw ApiError_1.ApiError.forbidden('Admin access required');
        }
        const stats = await media_service_1.mediaService.getStorageStats();
        res.json(new ApiResponse_1.ApiResponse(200, stats));
    }),
};
//# sourceMappingURL=media.controller.js.map
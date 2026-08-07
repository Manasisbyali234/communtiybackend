"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storyUploadController = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const asyncHandler_1 = require("../utils/asyncHandler");
const story_upload_service_1 = require("./story.upload.service");
const story_s3_service_1 = require("./story.s3.service");
const storage_1 = require("../config/storage");
exports.storyUploadController = {
    // POST /api/v1/story-upload/upload
    // Uploads file to stories/ in S3 and returns the proxy URL (no DB record yet).
    uploadMedia: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        if (!req.file)
            throw ApiError_1.ApiError.badRequest('No file provided');
        story_s3_service_1.storyS3Service.validate({
            buffer: req.file.buffer,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
        });
        const result = await story_upload_service_1.storyUploadService.uploadOnly({
            buffer: req.file.buffer,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
        });
        res.json(new ApiResponse_1.ApiResponse(200, { url: result.url, key: result.key }, 'Story media uploaded'));
    }),
    // POST /api/v1/story-upload/create
    // Uploads file to stories/ in S3 AND creates the Story DB record atomically.
    uploadAndCreate: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        if (!req.file)
            throw ApiError_1.ApiError.badRequest('No file provided');
        const rawType = req.body?.mediaType?.toUpperCase();
        const mediaType = rawType === 'VIDEO' ? 'VIDEO' : 'IMAGE';
        const story = await story_upload_service_1.storyUploadService.uploadAndCreate({
            buffer: req.file.buffer,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
        }, req.user.id, mediaType);
        res.status(201).json(new ApiResponse_1.ApiResponse(201, story, 'Story created'));
    }),
    // GET /api/v1/story-upload/proxy/:key(*)
    // Proxies S3 objects so the bucket doesn't need public access.
    proxyMedia: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const key = decodeURIComponent(req.params['key']);
        try {
            const command = new client_s3_1.GetObjectCommand({ Bucket: storage_1.storageBucket, Key: key });
            const s3Res = await storage_1.s3.send(command);
            if (s3Res.ContentType)
                res.setHeader('Content-Type', s3Res.ContentType);
            if (s3Res.ContentLength)
                res.setHeader('Content-Length', s3Res.ContentLength);
            res.setHeader('Cache-Control', 'public, max-age=86400');
            s3Res.Body.pipe(res);
        }
        catch {
            throw ApiError_1.ApiError.notFound('Story media not found');
        }
    }),
};
//# sourceMappingURL=story.upload.controller.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storyUploadController = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const asyncHandler_1 = require("../utils/asyncHandler");
const story_upload_service_1 = require("./story.upload.service");
const story_r2_service_1 = require("./story.r2.service");
const storage_1 = require("../config/storage");
exports.storyUploadController = {
    // POST /api/v1/story-upload/upload
    uploadMedia: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        if (!req.file)
            throw ApiError_1.ApiError.badRequest('No file provided');
        story_r2_service_1.storyR2Service.validate({
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
    // Proxies R2 objects with range request support for video playback.
    proxyMedia: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const key = decodeURIComponent(req.params['key']);
        try {
            const rangeHeader = req.headers['range'];
            const command = new client_s3_1.GetObjectCommand({
                Bucket: storage_1.storageBucket,
                Key: key,
                ...(rangeHeader ? { Range: rangeHeader } : {}),
            });
            const r2Res = await storage_1.r2.send(command);
            res.setHeader('Content-Type', r2Res.ContentType ?? 'application/octet-stream');
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            if (rangeHeader && r2Res.ContentRange) {
                res.setHeader('Content-Range', r2Res.ContentRange);
                if (r2Res.ContentLength)
                    res.setHeader('Content-Length', r2Res.ContentLength);
                res.status(206);
            }
            else {
                if (r2Res.ContentLength)
                    res.setHeader('Content-Length', r2Res.ContentLength);
                res.status(200);
            }
            r2Res.Body.pipe(res);
        }
        catch {
            throw ApiError_1.ApiError.notFound('Story media not found');
        }
    }),
};
//# sourceMappingURL=story.upload.controller.js.map
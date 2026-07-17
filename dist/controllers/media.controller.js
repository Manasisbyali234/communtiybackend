"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaController = exports.uploadMultipleMiddleware = exports.uploadMiddleware = void 0;
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const asyncHandler_1 = require("../utils/asyncHandler");
const media_service_1 = require("../services/media.service");
const multer_1 = __importDefault(require("multer"));
// Configure multer for file uploads
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
});
exports.uploadMiddleware = upload.single('file');
exports.uploadMultipleMiddleware = upload.array('files', 10);
exports.mediaController = {
    upload: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        if (!req.file) {
            throw ApiError_1.ApiError.badRequest('No file provided');
        }
        const result = await media_service_1.mediaService.uploadFile({
            buffer: req.file.buffer,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
        }, req.user.id);
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
        // Set appropriate headers
        res.set({
            'Content-Type': file.mimeType,
            'Content-Length': file.buffer.length.toString(),
            'Content-Disposition': `inline; filename="${file.originalName}"`,
            'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        });
        res.send(file.buffer);
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
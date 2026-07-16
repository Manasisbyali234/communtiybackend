"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaService = void 0;
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
const ApiError_1 = require("../utils/ApiError");
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
exports.mediaService = {
    /**
     * Store a file in the database
     */
    async uploadFile(file, uploadedBy) {
        try {
            // Generate unique filename
            const extension = path_1.default.extname(file.originalname);
            const filename = `${crypto_1.default.randomUUID()}${extension}`;
            // Validate file size (e.g., max 50MB)
            const maxSize = 50 * 1024 * 1024; // 50MB
            if (file.size > maxSize) {
                throw ApiError_1.ApiError.badRequest('File too large. Maximum size is 50MB.');
            }
            // Validate file type
            if (!this.isAllowedMimeType(file.mimetype)) {
                throw ApiError_1.ApiError.badRequest('File type not allowed.');
            }
            const mediaFile = await database_1.prisma.mediaFile.create({
                data: {
                    filename,
                    originalName: file.originalname,
                    mimeType: file.mimetype,
                    fileSize: file.size,
                    fileData: file.buffer,
                    uploadedBy,
                },
            });
            return {
                id: mediaFile.id,
                filename: mediaFile.filename,
                url: `/api/v1/media/${mediaFile.id}`,
            };
        }
        catch (error) {
            logger_1.logger.error({ error, originalname: file.originalname }, 'Failed to upload file');
            throw error instanceof ApiError_1.ApiError ? error : ApiError_1.ApiError.internal('Failed to upload file');
        }
    },
    /**
     * Upload multiple files
     */
    async uploadFiles(files, uploadedBy) {
        try {
            const results = await Promise.all(files.map(file => this.uploadFile(file, uploadedBy)));
            return results;
        }
        catch (error) {
            logger_1.logger.error({ error, fileCount: files.length }, 'Failed to upload multiple files');
            throw error;
        }
    },
    /**
     * Retrieve a file from the database
     */
    async getFile(id) {
        try {
            const mediaFile = await database_1.prisma.mediaFile.findUnique({
                where: { id },
                select: {
                    fileData: true,
                    mimeType: true,
                    filename: true,
                    originalName: true,
                },
            });
            if (!mediaFile) {
                return null;
            }
            return {
                buffer: mediaFile.fileData,
                mimeType: mediaFile.mimeType,
                filename: mediaFile.filename,
                originalName: mediaFile.originalName,
            };
        }
        catch (error) {
            logger_1.logger.error({ error, id }, 'Failed to get file');
            throw ApiError_1.ApiError.internal('Failed to retrieve file');
        }
    },
    /**
     * Delete a file from the database
     */
    async deleteFile(id, userId) {
        try {
            const whereClause = { id };
            // If userId provided, ensure user can only delete their own files
            if (userId) {
                whereClause.uploadedBy = userId;
            }
            const result = await database_1.prisma.mediaFile.deleteMany({
                where: whereClause,
            });
            if (result.count === 0) {
                throw ApiError_1.ApiError.notFound('File not found or you do not have permission to delete it');
            }
        }
        catch (error) {
            logger_1.logger.error({ error, id, userId }, 'Failed to delete file');
            throw error instanceof ApiError_1.ApiError ? error : ApiError_1.ApiError.internal('Failed to delete file');
        }
    },
    /**
     * Get file metadata
     */
    async getFileMetadata(id) {
        try {
            const mediaFile = await database_1.prisma.mediaFile.findUnique({
                where: { id },
                select: {
                    id: true,
                    filename: true,
                    originalName: true,
                    mimeType: true,
                    fileSize: true,
                    uploadedBy: true,
                    createdAt: true,
                },
            });
            if (!mediaFile) {
                return null;
            }
            return {
                ...mediaFile,
                url: `/api/v1/media/${mediaFile.id}`,
            };
        }
        catch (error) {
            logger_1.logger.error({ error, id }, 'Failed to get file metadata');
            throw ApiError_1.ApiError.internal('Failed to get file metadata');
        }
    },
    /**
     * Get user's uploaded files
     */
    async getUserFiles(userId, options = {}) {
        try {
            const { skip = 0, take = 20, mimeType } = options;
            const where = { uploadedBy: userId };
            if (mimeType) {
                where.mimeType = { startsWith: mimeType };
            }
            const [files, total] = await Promise.all([
                database_1.prisma.mediaFile.findMany({
                    where,
                    select: {
                        id: true,
                        filename: true,
                        originalName: true,
                        mimeType: true,
                        fileSize: true,
                        createdAt: true,
                    },
                    skip,
                    take,
                    orderBy: { createdAt: 'desc' },
                }),
                database_1.prisma.mediaFile.count({ where }),
            ]);
            return {
                files: files.map(file => ({
                    ...file,
                    url: `/api/v1/media/${file.id}`,
                })),
                total,
            };
        }
        catch (error) {
            logger_1.logger.error({ error, userId }, 'Failed to get user files');
            throw ApiError_1.ApiError.internal('Failed to get user files');
        }
    },
    /**
     * Clean up orphaned files (files not referenced by any posts, stories, etc.)
     */
    async cleanupOrphanedFiles() {
        try {
            // This is a complex query that would need to check references in posts, stories, etc.
            // For now, we'll just delete files older than 30 days that aren't referenced
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            // Get files that might be orphaned (older than 30 days)
            const potentialOrphans = await database_1.prisma.mediaFile.findMany({
                where: {
                    createdAt: { lt: thirtyDaysAgo },
                },
                select: { id: true, filename: true },
            });
            // For each file, check if it's referenced in any content
            // This is a simplified check - in a real app you'd check all tables that reference media
            const orphanedFiles = [];
            for (const file of potentialOrphans) {
                const referencedInPosts = await database_1.prisma.post.count({
                    where: {
                        mediaUrls: { has: `/api/v1/media/${file.id}` },
                    },
                });
                const referencedInStories = await database_1.prisma.story.count({
                    where: {
                        mediaUrl: `/api/v1/media/${file.id}`,
                    },
                });
                if (referencedInPosts === 0 && referencedInStories === 0) {
                    orphanedFiles.push(file.id);
                }
            }
            // Delete orphaned files
            if (orphanedFiles.length > 0) {
                const result = await database_1.prisma.mediaFile.deleteMany({
                    where: { id: { in: orphanedFiles } },
                });
                logger_1.logger.info({ deletedCount: result.count }, 'Cleaned up orphaned media files');
                return { deletedCount: result.count };
            }
            return { deletedCount: 0 };
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Failed to cleanup orphaned files');
            throw ApiError_1.ApiError.internal('Failed to cleanup orphaned files');
        }
    },
    /**
     * Get storage statistics
     */
    async getStorageStats() {
        try {
            const [totalFiles, totalSizeResult, filesByType] = await Promise.all([
                database_1.prisma.mediaFile.count(),
                database_1.prisma.mediaFile.aggregate({
                    _sum: { fileSize: true },
                    _avg: { fileSize: true },
                }),
                database_1.prisma.$queryRaw `
          SELECT "mimeType", COUNT(*) as count, SUM("fileSize") as "totalSize"
          FROM "MediaFile"
          GROUP BY "mimeType"
          ORDER BY "totalSize" DESC
        `,
            ]);
            return {
                totalFiles,
                totalSize: totalSizeResult._sum.fileSize || 0,
                averageSize: Math.round(totalSizeResult._avg.fileSize || 0),
                filesByType: filesByType.map(item => ({
                    mimeType: item.mimeType,
                    count: Number(item.count),
                    totalSize: Number(item.totalSize),
                })),
            };
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Failed to get storage statistics');
            throw ApiError_1.ApiError.internal('Failed to get storage statistics');
        }
    },
    /**
     * Check if mime type is allowed
     */
    isAllowedMimeType(mimeType) {
        const allowedTypes = [
            // Images
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            // Videos
            'video/mp4',
            'video/mpeg',
            'video/quicktime',
            'video/webm',
            // Audio
            'audio/mpeg',
            'audio/wav',
            'audio/ogg',
            'audio/mp3',
            // Documents
            'application/pdf',
            'text/plain',
            'application/json',
        ];
        return allowedTypes.includes(mimeType.toLowerCase());
    },
};
// Cleanup orphaned files every 24 hours
setInterval(() => {
    exports.mediaService.cleanupOrphanedFiles().catch(err => logger_1.logger.error({ err }, 'Background media cleanup failed'));
}, 24 * 60 * 60 * 1000);
//# sourceMappingURL=media.service.js.map
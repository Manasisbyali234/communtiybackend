interface UploadedFile {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
}
export declare const mediaService: {
    /**
     * Store a file in the database
     */
    uploadFile(file: UploadedFile, uploadedBy: string): Promise<{
        id: string;
        filename: string;
        url: string;
    }>;
    /**
     * Upload multiple files
     */
    uploadFiles(files: UploadedFile[], uploadedBy: string): Promise<Array<{
        id: string;
        filename: string;
        url: string;
    }>>;
    /**
     * Retrieve a file from the database
     */
    getFile(id: string): Promise<{
        buffer: Buffer;
        mimeType: string;
        filename: string;
        originalName: string;
    } | null>;
    /**
     * Delete a file from the database
     */
    deleteFile(id: string, userId?: string): Promise<void>;
    /**
     * Get file metadata
     */
    getFileMetadata(id: string): Promise<{
        id: string;
        filename: string;
        originalName: string;
        mimeType: string;
        fileSize: number;
        uploadedBy: string;
        createdAt: Date;
        url: string;
    } | null>;
    /**
     * Get user's uploaded files
     */
    getUserFiles(userId: string, options?: {
        skip?: number;
        take?: number;
        mimeType?: string;
    }): Promise<{
        files: Array<{
            id: string;
            filename: string;
            originalName: string;
            mimeType: string;
            fileSize: number;
            createdAt: Date;
            url: string;
        }>;
        total: number;
    }>;
    /**
     * Clean up orphaned files (files not referenced by any posts, stories, etc.)
     */
    cleanupOrphanedFiles(): Promise<{
        deletedCount: number;
    }>;
    /**
     * Get storage statistics
     */
    getStorageStats(): Promise<{
        totalFiles: number;
        totalSize: number;
        averageSize: number;
        filesByType: Array<{
            mimeType: string;
            count: number;
            totalSize: number;
        }>;
    }>;
    /**
     * Check if mime type is allowed
     */
    isAllowedMimeType(mimeType: string): boolean;
};
export {};
//# sourceMappingURL=media.service.d.ts.map
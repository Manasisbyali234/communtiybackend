interface UploadedFile {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
}
export declare const mediaService: {
    uploadFile(file: UploadedFile, uploadedBy: string): Promise<{
        id: string;
        filename: string;
        url: string;
    }>;
    uploadEventImage(file: UploadedFile, uploadedBy: string): Promise<{
        id: string;
        filename: string;
        url: string;
    }>;
    uploadProfilePhoto(file: UploadedFile, uploadedBy: string): Promise<{
        id: string;
        filename: string;
        url: string;
    }>;
    uploadCoverPhoto(file: UploadedFile, uploadedBy: string): Promise<{
        id: string;
        filename: string;
        url: string;
    }>;
    uploadChatFile(file: UploadedFile, uploadedBy: string): Promise<{
        id: string;
        filename: string;
        url: string;
        key: string;
        originalName: string;
        mimeType: string;
        fileSize: number;
    }>;
    uploadPostImage(file: UploadedFile, uploadedBy: string): Promise<{
        id: string;
        filename: string;
        url: string;
    }>;
    uploadPostVideo(file: UploadedFile, uploadedBy: string): Promise<{
        id: string;
        filename: string;
        url: string;
        mimeType: string;
        fileSize: number;
    }>;
    _uploadProfileToS3(file: UploadedFile, key: string, uploadedBy: string): Promise<{
        id: string;
        filename: string;
        url: string;
    }>;
    _uploadToS3(file: UploadedFile, key: string, uploadedBy: string): Promise<{
        id: string;
        filename: string;
        url: string;
    }>;
    uploadFiles(files: UploadedFile[], uploadedBy: string): Promise<any[]>;
    getFile(id: string): Promise<{
        url: string;
        mimeType: string;
        filename: string;
        originalName: string;
    }>;
    deleteFile(id: string, userId?: string): Promise<void>;
    getFileMetadata(id: string): Promise<{
        url: string;
        id: string;
        createdAt: Date;
        mimeType: string;
        fileSize: number;
        filename: string;
        originalName: string;
        uploadedBy: string;
    }>;
    getUserFiles(userId: string, { skip, take, mimeType }: {
        skip: number;
        take: number;
        mimeType?: string;
    }): Promise<{
        files: {
            url: string;
            id: string;
            createdAt: Date;
            mimeType: string;
            fileSize: number;
            filename: string;
            originalName: string;
            uploadedBy: string;
        }[];
        total: number;
    }>;
    getStorageStats(): Promise<{
        totalFiles: number;
        totalSize: number;
    }>;
};
export {};
//# sourceMappingURL=media.service.d.ts.map
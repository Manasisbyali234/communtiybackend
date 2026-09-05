export declare const MAX_MEDIA_UPLOAD_SIZE: number;
export declare const MAX_LOGO_UPLOAD_SIZE: number;
export interface UploadedFile {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
}
export declare function prepareImageForUpload(file: UploadedFile): Promise<UploadedFile>;
export declare function prepareVideoForUpload(file: UploadedFile): Promise<UploadedFile>;
export declare function prepareMediaForUpload(file: UploadedFile): Promise<UploadedFile>;
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
    uploadCommunityImage(file: UploadedFile, uploadedBy: string): Promise<{
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
    _uploadProfileToStorage(file: UploadedFile, key: string, uploadedBy: string): Promise<{
        id: string;
        filename: string;
        url: string;
    }>;
    _uploadToStorage(file: UploadedFile, key: string, uploadedBy: string): Promise<{
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
//# sourceMappingURL=media.service.d.ts.map
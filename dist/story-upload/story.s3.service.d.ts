export interface StoryFileInput {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
}
export interface StoryUploadResult {
    key: string;
    url: string;
}
export declare const storyS3Service: {
    validate(file: StoryFileInput): void;
    upload(file: StoryFileInput): Promise<StoryUploadResult>;
};
//# sourceMappingURL=story.s3.service.d.ts.map
import { UploadedFile } from '../services/media.service';
export type StoryFileInput = UploadedFile;
export interface StoryUploadResult {
    key: string;
    url: string;
}
export declare const storyR2Service: {
    validate(file: StoryFileInput): void;
    upload(file: StoryFileInput): Promise<StoryUploadResult>;
};
//# sourceMappingURL=story.r2.service.d.ts.map
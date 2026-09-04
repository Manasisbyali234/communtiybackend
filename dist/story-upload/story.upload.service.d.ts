import { StoryFileInput } from './story.r2.service';
import { MediaType } from '@prisma/client';
export declare const storyUploadService: {
    uploadAndCreate(file: StoryFileInput, authorId: string, mediaType: MediaType): Promise<any>;
    uploadOnly(file: StoryFileInput): Promise<import("./story.r2.service").StoryUploadResult>;
};
//# sourceMappingURL=story.upload.service.d.ts.map
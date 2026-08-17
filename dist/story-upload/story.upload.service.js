"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storyUploadService = void 0;
const database_1 = require("../config/database");
const story_s3_service_1 = require("./story.s3.service");
exports.storyUploadService = {
    async uploadAndCreate(file, authorId, mediaType) {
        // 1. Upload to S3 stories/ folder
        const { url } = await story_s3_service_1.storyS3Service.upload(file);
        // 2. Create Story record with the S3 URL
        const STORY_TTL_SECONDS = 24 * 60 * 60;
        const expiresAt = new Date(Date.now() + STORY_TTL_SECONDS * 1000);
        let story;
        try {
            story = await database_1.prisma.story.create({
                data: { authorId, mediaUrl: url, mediaType, expiresAt },
                include: {
                    author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
                },
            });
        }
        catch (dbErr) {
            // Story DB insert failed — nothing to clean up in S3 (S3 objects are cheap; orphan cleanup
            // can be handled by a lifecycle rule on the stories/ prefix). Re-throw so the controller
            // returns a proper error to the client.
            throw dbErr;
        }
        return story;
    },
    async uploadOnly(file) {
        return story_s3_service_1.storyS3Service.upload(file);
    },
};
//# sourceMappingURL=story.upload.service.js.map
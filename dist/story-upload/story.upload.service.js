"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storyUploadService = void 0;
const database_1 = require("../config/database");
const story_r2_service_1 = require("./story.r2.service");
exports.storyUploadService = {
    async uploadAndCreate(file, authorId, mediaType) {
        // 1. Upload to the R2 stories/ prefix
        const { url } = await story_r2_service_1.storyR2Service.upload(file);
        // 2. Create Story record with the R2-backed proxy URL
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
            // Story DB insert failed; orphan cleanup can be handled by a lifecycle rule
            // on the stories/ prefix. Re-throw so the controller
            // returns a proper error to the client.
            throw dbErr;
        }
        return story;
    },
    async uploadOnly(file) {
        return story_r2_service_1.storyR2Service.upload(file);
    },
};
//# sourceMappingURL=story.upload.service.js.map
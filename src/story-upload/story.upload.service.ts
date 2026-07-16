import { prisma } from '../config/database';
import { storyS3Service, StoryFileInput } from './story.s3.service';
import { MediaType } from '@prisma/client';

export const storyUploadService = {
  async uploadAndCreate(
    file: StoryFileInput,
    authorId: string,
    mediaType: MediaType
  ) {
    // 1. Upload to S3 stories/ folder
    const { url } = await storyS3Service.upload(file);

    // 2. Create Story record with the S3 URL
    const STORY_TTL_SECONDS = 24 * 60 * 60;
    const expiresAt = new Date(Date.now() + STORY_TTL_SECONDS * 1000);

    let story;
    try {
      story = await prisma.story.create({
        data: { authorId, mediaUrl: url, mediaType, expiresAt },
        include: {
          author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        },
      });
    } catch (dbErr) {
      // Story DB insert failed — nothing to clean up in S3 (S3 objects are cheap; orphan cleanup
      // can be handled by a lifecycle rule on the stories/ prefix). Re-throw so the controller
      // returns a proper error to the client.
      throw dbErr;
    }

    return story;
  },

  async uploadOnly(file: StoryFileInput) {
    return storyS3Service.upload(file);
  },
};

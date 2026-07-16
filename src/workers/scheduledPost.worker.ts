import { Worker, QUEUE_NAMES } from '../config/bullmq';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

// Helper to extract hashtags from content
function extractHashtags(content: string): string[] {
  const regex = /#[\w\u0590-\u05ff]+/g;
  const matches = content.match(regex);
  if (!matches) return [];
  return [...new Set(matches.map((t) => t.slice(1).toLowerCase()))];
}

async function syncHashtags(postId: string, content: string) {
  const tags = extractHashtags(content);
  if (!tags.length) return;

  for (const tag of tags) {
    let hashtag = await prisma.hashtag.findUnique({ where: { name: tag } });
    if (!hashtag) {
      hashtag = await prisma.hashtag.create({ data: { name: tag } });
    } else {
      await prisma.hashtag.update({
        where: { id: hashtag.id },
        data: { postsCount: { increment: 1 } },
      });
    }

    await prisma.postHashtag.create({
      data: { postId, hashtagId: hashtag.id },
    });
  }
}

export const scheduledPostWorker = new Worker(
  QUEUE_NAMES.SCHEDULED_POST,
  async (job: { name: string; data: { postId: string } }) => {
    const { postId } = job.data;
    logger.info({ postId }, 'Processing scheduled post');

    const post = await prisma.post.findUnique({ where: { id: postId, deletedAt: null } });
    if (!post) {
      logger.warn({ postId }, 'Scheduled post not found or deleted, skipping');
      return;
    }

    if (!post.scheduledAt) {
      logger.info({ postId }, 'Post already published, skipping');
      return;
    }

    await prisma.post.update({
      where: { id: postId },
      data: { scheduledAt: null, createdAt: new Date() }, // update createdAt to now so it bumps in feed
    });

    await syncHashtags(postId, post.content);
    logger.info({ postId }, 'Scheduled post published successfully');
  },
);

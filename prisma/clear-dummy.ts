import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Clearing dummy data...');

  // Delete everything except we'll recreate admin after
  // Leaf / dependent tables first
  await prisma.adminSession.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.eventRsvp.deleteMany();
  await prisma.event.deleteMany();
  await prisma.messageReaction.deleteMany();
  await prisma.messageHide.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.storyView.deleteMany();
  await prisma.storyReply.deleteMany();
  await prisma.like.deleteMany();
  await prisma.story.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.postHashtag.deleteMany();
  await prisma.hashtag.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.communityInvite.deleteMany();
  await prisma.communityRule.deleteMany();
  await prisma.communityMember.deleteMany();
  await prisma.community.deleteMany();
  await prisma.connectionRequest.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.userBlock.deleteMany();
  await prisma.userSetting.deleteMany();
  await prisma.deviceToken.deleteMany();
  await prisma.mediaFile.deleteMany();
  await prisma.cacheEntry.deleteMany();
  await prisma.otp.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.oAuthAccount.deleteMany();
  await prisma.report.deleteMany();
  await prisma.auditLog.deleteMany();

  // Delete all non-admin users (dummy users)
  await prisma.user.deleteMany({
    where: { role: { not: 'ADMIN' } },
  });

  // Keep admin user but update password if needed
  const existing = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!existing) {
    const passwordHash = await bcrypt.hash('Admin@1234', 12);
    await prisma.user.create({
      data: {
        email: 'admin@community.app',
        username: 'admin',
        passwordHash,
        displayName: 'Admin',
        role: 'ADMIN',
        isVerified: true,
      },
    });
    console.log('✅ Admin user created: admin@community.app / Admin@1234');
  } else {
    console.log(`✅ Admin user kept: ${existing.email}`);
  }

  console.log('✅ All dummy data cleared. Database is clean.');
}

main().catch(console.error).finally(() => prisma.$disconnect());

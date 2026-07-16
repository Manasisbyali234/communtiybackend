import { prisma } from '../config/database';
import { PrivacyLevel } from '@prisma/client';

interface UserSettingData {
  isPrivateAccount?: boolean;
  whoCanMessage?: PrivacyLevel;
  whoCanSeeFollowers?: PrivacyLevel;
  notifyLikes?: boolean;
  notifyComments?: boolean;
  notifyFollows?: boolean;
  notifyMessages?: boolean;
  notifyStoryViews?: boolean;
  notifyEvents?: boolean;
}

export const settingsService = {
  async getSettings(userId: string) {
    const settings = await prisma.userSetting.findUnique({ where: { userId } });
    if (!settings) {
      // Create default settings if none exist
      return prisma.userSetting.create({ data: { userId } });
    }
    return settings;
  },

  async updateSettings(userId: string, data: UserSettingData) {
    return prisma.userSetting.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  },
};

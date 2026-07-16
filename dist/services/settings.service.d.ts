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
export declare const settingsService: {
    getSettings(userId: string): Promise<{
        id: string;
        userId: string;
        updatedAt: Date;
        isPrivateAccount: boolean;
        whoCanMessage: import(".prisma/client").$Enums.PrivacyLevel;
        whoCanSeeFollowers: import(".prisma/client").$Enums.PrivacyLevel;
        notifyLikes: boolean;
        notifyComments: boolean;
        notifyFollows: boolean;
        notifyMessages: boolean;
        notifyStoryViews: boolean;
        notifyEvents: boolean;
    }>;
    updateSettings(userId: string, data: UserSettingData): Promise<{
        id: string;
        userId: string;
        updatedAt: Date;
        isPrivateAccount: boolean;
        whoCanMessage: import(".prisma/client").$Enums.PrivacyLevel;
        whoCanSeeFollowers: import(".prisma/client").$Enums.PrivacyLevel;
        notifyLikes: boolean;
        notifyComments: boolean;
        notifyFollows: boolean;
        notifyMessages: boolean;
        notifyStoryViews: boolean;
        notifyEvents: boolean;
    }>;
};
export {};
//# sourceMappingURL=settings.service.d.ts.map
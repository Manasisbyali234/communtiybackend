import { CommunityMemberRole } from '@prisma/client';
export declare const communitiesService: {
    list(params: {
        cursor?: string;
        limit?: number;
        category?: string;
        search?: string;
        sort?: "popular" | "newest";
        userId?: string;
    }): Promise<{
        data: any[];
        nextCursor: string | null;
        hasMore: boolean;
    }>;
    create(creatorId: string, data: {
        name: string;
        description?: string;
        category: string;
        isPrivate?: boolean;
        avatarUrl?: string;
        bannerUrl?: string;
        feedPostPrompts?: string[];
    }): Promise<{
        status: import(".prisma/client").$Enums.CommunityStatus;
        name: string;
        id: string;
        createdAt: Date;
        avatarUrl: string | null;
        bannerUrl: string | null;
        updatedAt: Date;
        description: string | null;
        slug: string;
        category: string;
        isPrivate: boolean;
        memberCount: number;
        feedPostPrompts: string[];
    }>;
    getMyRequests(userId: string): Promise<{
        status: import(".prisma/client").$Enums.CommunityStatus;
        name: string;
        id: string;
        createdAt: Date;
        avatarUrl: string | null;
        bannerUrl: string | null;
        updatedAt: Date;
        description: string | null;
        slug: string;
        category: string;
        isPrivate: boolean;
        memberCount: number;
        feedPostPrompts: string[];
    }[]>;
    getById(id: string, userId: string): Promise<{
        isJoined: boolean;
        memberRole: import(".prisma/client").$Enums.CommunityMemberRole;
        memberStatus: import(".prisma/client").$Enums.CommunityMemberStatus;
        rules: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            communityId: string;
            title: string;
            order: number;
        }[];
        feedPostPrompts: string[];
        status: import(".prisma/client").$Enums.CommunityStatus;
        name: string;
        id: string;
        createdAt: Date;
        avatarUrl: string | null;
        bannerUrl: string | null;
        updatedAt: Date;
        description: string | null;
        slug: string;
        category: string;
        isPrivate: boolean;
        memberCount: number;
    }>;
    update(communityId: string, userId: string, data: Partial<{
        name: string;
        description: string;
        avatarUrl: string;
        bannerUrl: string;
        category: string;
        isPrivate: boolean;
    }>): Promise<{
        status: import(".prisma/client").$Enums.CommunityStatus;
        name: string;
        id: string;
        createdAt: Date;
        avatarUrl: string | null;
        bannerUrl: string | null;
        updatedAt: Date;
        description: string | null;
        slug: string;
        category: string;
        isPrivate: boolean;
        memberCount: number;
        feedPostPrompts: string[];
    }>;
    delete(communityId: string, userId: string): Promise<void>;
    join(communityId: string, userId: string): Promise<{
        status: "ACTIVE" | "PENDING";
    }>;
    leave(communityId: string, userId: string): Promise<void>;
    getPendingMembers(communityId: string, requesterId: string): Promise<{
        joinedAt: Date;
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string;
    }[]>;
    approveMember(communityId: string, requesterId: string, targetUserId: string): Promise<void>;
    rejectMember(communityId: string, requesterId: string, targetUserId: string): Promise<void>;
    getMembers(communityId: string, cursor?: string, limit?: number): Promise<import("../utils/pagination").CursorPage<{
        role: import(".prisma/client").$Enums.CommunityMemberRole;
        joinedAt: Date;
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string;
    }>>;
    updateMemberRole(communityId: string, requesterId: string, targetUserId: string, role: CommunityMemberRole): Promise<{
        status: import(".prisma/client").$Enums.CommunityMemberStatus;
        id: string;
        userId: string;
        role: import(".prisma/client").$Enums.CommunityMemberRole;
        communityId: string;
        joinedAt: Date;
    }>;
    removeMember(communityId: string, requesterId: string, targetUserId: string): Promise<void>;
    getCommunityPosts(communityId: string, userId: string, cursor?: string, limit?: number): Promise<import("../utils/pagination").CursorPage<{
        status: import(".prisma/client").$Enums.PostStatus;
        community: {
            name: string;
            id: string;
            avatarUrl: string;
            slug: string;
        };
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        mediaType: import(".prisma/client").$Enums.MediaType;
        mediaUrls: string[];
        videoUrl: string;
        videoFileName: string;
        mimeType: string;
        fileSize: number;
        likesCount: number;
        commentsCount: number;
        sharesCount: number;
        isDraft: boolean;
        scheduledAt: Date;
        author: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string;
        };
        hashtags: {
            hashtag: {
                name: string;
                id: string;
            };
        }[];
    }>>;
    getRules(communityId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        communityId: string;
        title: string;
        order: number;
    }[]>;
    addRule(communityId: string, requesterId: string, data: {
        title: string;
        description?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        communityId: string;
        title: string;
        order: number;
    }>;
    updateRule(communityId: string, ruleId: string, requesterId: string, data: {
        title?: string;
        description?: string;
        order?: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        communityId: string;
        title: string;
        order: number;
    }>;
    deleteRule(communityId: string, ruleId: string, requesterId: string): Promise<void>;
    inviteMember(communityId: string, senderId: string, recipientId: string): Promise<void>;
    acceptInvite(communityId: string, userId: string): Promise<void>;
    declineInvite(communityId: string, userId: string): Promise<void>;
    getMyInvites(userId: string): Promise<({
        community: {
            name: string;
            id: string;
            avatarUrl: string;
            slug: string;
        };
        sender: {
            id: string;
            username: string;
            displayName: string;
        };
    } & {
        status: string;
        id: string;
        expiresAt: Date;
        createdAt: Date;
        senderId: string;
        recipientId: string;
        communityId: string;
    })[]>;
    requireRole(communityId: string, userId: string, roles: CommunityMemberRole[]): Promise<void>;
};
//# sourceMappingURL=communities.service.d.ts.map
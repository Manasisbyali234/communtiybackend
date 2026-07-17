import { CommunityMemberRole } from '@prisma/client';
export declare const communitiesService: {
    list(params: {
        cursor?: string;
        limit?: number;
        category?: string;
        search?: string;
        sort?: "popular" | "newest";
    }): Promise<import("../utils/pagination").CursorPage<{
        name: string;
        id: string;
        createdAt: Date;
        avatarUrl: string | null;
        bannerUrl: string | null;
        updatedAt: Date;
        slug: string;
        description: string | null;
        category: string;
        isPrivate: boolean;
        memberCount: number;
    }>>;
    create(creatorId: string, data: {
        name: string;
        description?: string;
        category: string;
        isPrivate?: boolean;
        avatarUrl?: string;
        bannerUrl?: string;
    }): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        avatarUrl: string | null;
        bannerUrl: string | null;
        updatedAt: Date;
        slug: string;
        description: string | null;
        category: string;
        isPrivate: boolean;
        memberCount: number;
    }>;
    getById(id: string, userId: string): Promise<{
        isJoined: boolean;
        memberRole: import(".prisma/client").$Enums.CommunityMemberRole | null;
        memberStatus: import(".prisma/client").$Enums.CommunityMemberStatus | null;
        rules: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            communityId: string;
            description: string | null;
            title: string;
            order: number;
        }[];
        name: string;
        id: string;
        createdAt: Date;
        avatarUrl: string | null;
        bannerUrl: string | null;
        updatedAt: Date;
        slug: string;
        description: string | null;
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
        name: string;
        id: string;
        createdAt: Date;
        avatarUrl: string | null;
        bannerUrl: string | null;
        updatedAt: Date;
        slug: string;
        description: string | null;
        category: string;
        isPrivate: boolean;
        memberCount: number;
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
        avatarUrl: string | null;
    }[]>;
    approveMember(communityId: string, requesterId: string, targetUserId: string): Promise<void>;
    rejectMember(communityId: string, requesterId: string, targetUserId: string): Promise<void>;
    getMembers(communityId: string, cursor?: string, limit?: number): Promise<import("../utils/pagination").CursorPage<{
        role: import(".prisma/client").$Enums.CommunityMemberRole;
        joinedAt: Date;
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
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
    getCommunityPosts(communityId: string, cursor?: string, limit?: number): Promise<import("../utils/pagination").CursorPage<{
        author: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        deletedAt: Date | null;
        updatedAt: Date;
        authorId: string;
        communityId: string | null;
        content: string;
        mediaUrls: string[];
        mediaType: import(".prisma/client").$Enums.MediaType | null;
        likesCount: number;
        commentsCount: number;
        sharesCount: number;
        isDraft: boolean;
        scheduledAt: Date | null;
    }>>;
    getRules(communityId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        communityId: string;
        description: string | null;
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
        communityId: string;
        description: string | null;
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
        communityId: string;
        description: string | null;
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
            avatarUrl: string | null;
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
        recipientId: string;
        communityId: string;
        senderId: string;
    })[]>;
    requireRole(communityId: string, userId: string, roles: CommunityMemberRole[]): Promise<void>;
};
//# sourceMappingURL=communities.service.d.ts.map
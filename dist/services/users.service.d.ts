export declare const usersService: {
    getMe(userId: string): Promise<{
        followersCount: number;
        followingCount: number;
        postsCount: number;
        email: string;
        id: string;
        createdAt: Date;
        username: string;
        displayName: string;
        bio: string | null;
        avatarUrl: string | null;
        bannerUrl: string | null;
        role: import(".prisma/client").$Enums.Role;
        isVerified: boolean;
        _count: {
            posts: number;
            following: number;
            followers: number;
        };
    }>;
    updateMe(userId: string, data: {
        displayName?: string;
        bio?: string;
        avatarUrl?: string;
        bannerUrl?: string;
    }): Promise<{
        id: string;
        username: string;
        displayName: string;
        bio: string | null;
        avatarUrl: string | null;
        bannerUrl: string | null;
    }>;
    deactivateMe(userId: string): Promise<void>;
    getPublicProfile(userId: string, viewerId: string): Promise<{
        followersCount: number;
        followingCount: number;
        postsCount: number;
        isFollowing: boolean;
        id: string;
        createdAt: Date;
        username: string;
        displayName: string;
        bio: string | null;
        avatarUrl: string | null;
        bannerUrl: string | null;
        role: import(".prisma/client").$Enums.Role;
        isVerified: boolean;
        _count: {
            posts: number;
            following: number;
            followers: number;
        };
    }>;
    followUser(followerId: string, followingId: string): Promise<void>;
    unfollowUser(followerId: string, followingId: string): Promise<void>;
    getFollowers(userId: string, cursor?: string, limit?: number): Promise<import("../utils/pagination").CursorPage<{
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
    }>>;
    getFollowing(userId: string, cursor?: string, limit?: number): Promise<import("../utils/pagination").CursorPage<{
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
    }>>;
    getUserPosts(userId: string, cursor?: string, limit?: number): Promise<import("../utils/pagination").CursorPage<{
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
    updatePushToken(userId: string, expoPushToken: string): Promise<void>;
};
//# sourceMappingURL=users.service.d.ts.map
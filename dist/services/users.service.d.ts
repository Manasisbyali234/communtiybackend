export declare const usersService: {
    getMe(userId: string): Promise<{
        followersCount: number;
        followingCount: number;
        postsCount: number;
        communitiesCount: number;
        email: string;
        id: string;
        createdAt: Date;
        username: string;
        displayName: string;
        bio: string;
        avatarUrl: string;
        bannerUrl: string;
        coverImage: string;
        village: string;
        occupation: string;
        languages: string;
        interests: string;
        role: import(".prisma/client").$Enums.Role;
        isVerified: boolean;
        _count: {
            posts: number;
            following: number;
            followers: number;
            communityMembers: number;
        };
    }>;
    updateMe(userId: string, data: {
        displayName?: string;
        bio?: string;
        avatarUrl?: string;
        bannerUrl?: string;
        coverImage?: string | null;
        village?: string;
        occupation?: string;
        languages?: string;
        interests?: string;
    }): Promise<{
        id: string;
        username: string;
        displayName: string;
        bio: string;
        avatarUrl: string;
        bannerUrl: string;
        coverImage: string;
        village: string;
        occupation: string;
        languages: string;
        interests: string;
    }>;
    deactivateMe(userId: string, reason?: string): Promise<void>;
    getPublicProfile(userId: string, viewerId: string): Promise<{
        followersCount: number;
        followingCount: number;
        postsCount: number;
        isFollowing: boolean;
        id: string;
        createdAt: Date;
        username: string;
        displayName: string;
        bio: string;
        avatarUrl: string;
        bannerUrl: string;
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
        avatarUrl: string;
    }>>;
    getFollowing(userId: string, cursor?: string, limit?: number): Promise<import("../utils/pagination").CursorPage<{
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string;
    }>>;
    getUserPosts(userId: string, cursor?: string, limit?: number): Promise<import("../utils/pagination").CursorPage<{
        author: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string;
        };
    } & {
        status: import(".prisma/client").$Enums.PostStatus;
        id: string;
        createdAt: Date;
        deletedAt: Date | null;
        updatedAt: Date;
        content: string;
        mediaType: import(".prisma/client").$Enums.MediaType | null;
        authorId: string;
        communityId: string | null;
        mediaUrls: string[];
        videoUrl: string | null;
        videoFileName: string | null;
        mimeType: string | null;
        fileSize: number | null;
        likesCount: number;
        commentsCount: number;
        sharesCount: number;
        isDraft: boolean;
        scheduledAt: Date | null;
    }>>;
    updatePushToken(userId: string, expoPushToken: string): Promise<void>;
};
//# sourceMappingURL=users.service.d.ts.map
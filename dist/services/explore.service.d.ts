export declare const exploreService: {
    getTrendingPosts(userId: string, limit?: number): Promise<{
        community: {
            name: string;
            id: string;
            slug: string;
        };
        id: string;
        createdAt: Date;
        content: string;
        mediaType: import(".prisma/client").$Enums.MediaType;
        mediaUrls: string[];
        likesCount: number;
        commentsCount: number;
        author: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string;
        };
    }[]>;
    getTrendingCommunities(limit?: number): Promise<{
        name: string;
        id: string;
        avatarUrl: string;
        description: string;
        slug: string;
        category: string;
        memberCount: number;
    }[]>;
    getSuggestedUsers(userId: string, limit?: number): Promise<{
        id: string;
        username: string;
        displayName: string;
        bio: string;
        avatarUrl: string;
        role: import(".prisma/client").$Enums.Role;
        isVerified: boolean;
        _count: {
            followers: number;
        };
    }[]>;
    getSuggestedCommunities(userId: string, limit?: number): Promise<{
        name: string;
        id: string;
        avatarUrl: string;
        description: string;
        slug: string;
        category: string;
        memberCount: number;
    }[]>;
    getTrendingHashtags(limit?: number): Promise<{
        name: string;
        id: string;
        postsCount: number;
    }[]>;
    getPostsByHashtag(hashtagName: string, userId: string, cursor?: string, limit?: number): Promise<{
        items: ({
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
        })[];
        nextCursor: string;
        hasMore: boolean;
    }>;
};
//# sourceMappingURL=explore.service.d.ts.map
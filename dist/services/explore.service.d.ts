export declare const exploreService: {
    getTrendingPosts(userId: string, limit?: number): Promise<{
        community: {
            name: string;
            id: string;
            slug: string;
        } | null;
        id: string;
        createdAt: Date;
        content: string;
        mediaUrls: string[];
        mediaType: import(".prisma/client").$Enums.MediaType | null;
        likesCount: number;
        commentsCount: number;
        author: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        };
    }[]>;
    getTrendingCommunities(limit?: number): Promise<{
        name: string;
        id: string;
        avatarUrl: string | null;
        slug: string;
        description: string | null;
        category: string;
        memberCount: number;
    }[]>;
    getSuggestedUsers(userId: string, limit?: number): Promise<{
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
        isVerified: boolean;
    }[]>;
    getSuggestedCommunities(userId: string, limit?: number): Promise<{
        name: string;
        id: string;
        avatarUrl: string | null;
        slug: string;
        description: string | null;
        category: string;
        memberCount: number;
    }[]>;
    getTrendingHashtags(limit?: number): Promise<{
        name: string;
        id: string;
        postsCount: number;
    }[]>;
    getPostsByHashtag(hashtagName: string, userId: string, cursor?: string, limit?: number): Promise<{
        items: any[];
        nextCursor: string | null | undefined;
        hasMore: boolean;
    }>;
};
//# sourceMappingURL=explore.service.d.ts.map
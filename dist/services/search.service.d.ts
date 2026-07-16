export declare const searchService: {
    search(query: string, userId: string, limit?: number): Promise<{
        users: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
            isVerified: boolean;
        }[];
        posts: {
            id: string;
            createdAt: Date;
            content: string;
            author: {
                id: string;
                username: string;
                displayName: string;
                avatarUrl: string | null;
            };
        }[];
        communities: {
            name: string;
            id: string;
            avatarUrl: string | null;
            slug: string;
            category: string;
            memberCount: number;
        }[];
        events: {
            id: string;
            title: string;
            location: string | null;
            startsAt: Date;
            rsvpCount: number;
        }[];
        hashtags: {
            name: string;
            id: string;
            postsCount: number;
        }[];
    }>;
    searchUsers(query: string, userId: string, limit?: number): Promise<{
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
        isVerified: boolean;
    }[]>;
    searchPosts(query: string, userId: string, limit?: number): Promise<({
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
    })[]>;
    searchCommunities(query: string, limit?: number): Promise<{
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
    }[]>;
    searchEvents(query: string, limit?: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        communityId: string | null;
        description: string | null;
        title: string;
        creatorId: string;
        location: string | null;
        startsAt: Date;
        endsAt: Date | null;
        coverUrl: string | null;
        rsvpCount: number;
    }[]>;
    searchHashtags(query: string, limit?: number): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        postsCount: number;
    }[]>;
};
//# sourceMappingURL=search.service.d.ts.map
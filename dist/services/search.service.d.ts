export declare const searchService: {
    search(query: string, userId: string, limit?: number): Promise<{
        users: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string;
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
                avatarUrl: string;
            };
        }[];
        communities: {
            name: string;
            id: string;
            avatarUrl: string;
            slug: string;
            category: string;
            memberCount: number;
        }[];
        events: {
            id: string;
            location: string;
            title: string;
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
        avatarUrl: string;
        isVerified: boolean;
    }[]>;
    searchPosts(query: string, userId: string, limit?: number): Promise<({
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
    })[]>;
    searchCommunities(query: string, limit?: number): Promise<{
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
    searchEvents(query: string, limit?: number): Promise<{
        status: import(".prisma/client").$Enums.EventStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        communityId: string | null;
        likesCount: number;
        commentsCount: number;
        sharesCount: number;
        location: string | null;
        title: string;
        creatorId: string;
        startsAt: Date;
        endsAt: Date | null;
        coverUrl: string | null;
        rsvpCount: number;
        interestedCount: number;
    }[]>;
    searchHashtags(query: string, limit?: number): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        postsCount: number;
    }[]>;
};
//# sourceMappingURL=search.service.d.ts.map
export declare const postsService: {
    getFeed(userId: string, cursor?: string, limit?: number): Promise<import("../utils/pagination").CursorPage<{
        community: {
            name: string;
            id: string;
            avatarUrl: string | null;
            slug: string;
        } | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        mediaUrls: string[];
        mediaType: import(".prisma/client").$Enums.MediaType | null;
        likesCount: number;
        commentsCount: number;
        sharesCount: number;
        isDraft: boolean;
        scheduledAt: Date | null;
        author: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        };
        hashtags: {
            hashtag: {
                name: string;
                id: string;
            };
        }[];
    }>>;
    createPost(authorId: string, data: {
        content: string;
        mediaUrls?: string[];
        communityId?: string;
        isDraft?: boolean;
        scheduledAt?: Date | null;
    }): Promise<{
        community: {
            name: string;
            id: string;
            avatarUrl: string | null;
            slug: string;
        } | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        mediaUrls: string[];
        mediaType: import(".prisma/client").$Enums.MediaType | null;
        likesCount: number;
        commentsCount: number;
        sharesCount: number;
        isDraft: boolean;
        scheduledAt: Date | null;
        author: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        };
        hashtags: {
            hashtag: {
                name: string;
                id: string;
            };
        }[];
    }>;
    getPost(postId: string, viewerId?: string): Promise<{
        community: {
            name: string;
            id: string;
            avatarUrl: string | null;
            slug: string;
        } | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        likes: {
            id: string;
            createdAt: Date;
            userId: string;
            postId: string | null;
            commentId: string | null;
            storyId: string | null;
        }[];
        bookmarks: {
            id: string;
            createdAt: Date;
            userId: string;
            postId: string;
        }[];
        content: string;
        mediaUrls: string[];
        mediaType: import(".prisma/client").$Enums.MediaType | null;
        likesCount: number;
        commentsCount: number;
        sharesCount: number;
        isDraft: boolean;
        scheduledAt: Date | null;
        author: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        };
        hashtags: {
            hashtag: {
                name: string;
                id: string;
            };
        }[];
    }>;
    updatePost(postId: string, userId: string, data: {
        content?: string;
        isDraft?: boolean;
    }): Promise<{
        community: {
            name: string;
            id: string;
            avatarUrl: string | null;
            slug: string;
        } | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        mediaUrls: string[];
        mediaType: import(".prisma/client").$Enums.MediaType | null;
        likesCount: number;
        commentsCount: number;
        sharesCount: number;
        isDraft: boolean;
        scheduledAt: Date | null;
        author: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        };
        hashtags: {
            hashtag: {
                name: string;
                id: string;
            };
        }[];
    }>;
    deletePost(postId: string, userId: string, role: string): Promise<void>;
    publishDraft(postId: string, userId: string): Promise<{
        community: {
            name: string;
            id: string;
            avatarUrl: string | null;
            slug: string;
        } | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        mediaUrls: string[];
        mediaType: import(".prisma/client").$Enums.MediaType | null;
        likesCount: number;
        commentsCount: number;
        sharesCount: number;
        isDraft: boolean;
        scheduledAt: Date | null;
        author: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        };
        hashtags: {
            hashtag: {
                name: string;
                id: string;
            };
        }[];
    }>;
    getDrafts(userId: string, cursor?: string, limit?: number): Promise<import("../utils/pagination").CursorPage<{
        community: {
            name: string;
            id: string;
            avatarUrl: string | null;
            slug: string;
        } | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        mediaUrls: string[];
        mediaType: import(".prisma/client").$Enums.MediaType | null;
        likesCount: number;
        commentsCount: number;
        sharesCount: number;
        isDraft: boolean;
        scheduledAt: Date | null;
        author: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        };
        hashtags: {
            hashtag: {
                name: string;
                id: string;
            };
        }[];
    }>>;
    likePost(postId: string, userId: string): Promise<void>;
    unlikePost(postId: string, userId: string): Promise<void>;
    getTrendingPosts(userId: string, cursor?: string, limit?: number): Promise<import("../utils/pagination").CursorPage<{
        community: {
            name: string;
            id: string;
            avatarUrl: string | null;
            slug: string;
        } | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        mediaUrls: string[];
        mediaType: import(".prisma/client").$Enums.MediaType | null;
        likesCount: number;
        commentsCount: number;
        sharesCount: number;
        isDraft: boolean;
        scheduledAt: Date | null;
        author: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        };
        hashtags: {
            hashtag: {
                name: string;
                id: string;
            };
        }[];
    }>>;
};
//# sourceMappingURL=posts.service.d.ts.map
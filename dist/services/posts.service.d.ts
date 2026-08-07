export declare const POST_SELECT: {
    id: boolean;
    content: boolean;
    mediaUrls: boolean;
    mediaType: boolean;
    videoUrl: boolean;
    videoFileName: boolean;
    mimeType: boolean;
    fileSize: boolean;
    likesCount: boolean;
    commentsCount: boolean;
    sharesCount: boolean;
    isDraft: boolean;
    scheduledAt: boolean;
    status: boolean;
    createdAt: boolean;
    updatedAt: boolean;
    author: {
        select: {
            id: boolean;
            username: boolean;
            displayName: boolean;
            avatarUrl: boolean;
        };
    };
    community: {
        select: {
            id: boolean;
            name: boolean;
            slug: boolean;
            avatarUrl: boolean;
        };
    };
    hashtags: {
        select: {
            hashtag: {
                select: {
                    id: boolean;
                    name: boolean;
                };
            };
        };
    };
};
export declare const postsService: {
    getFeed(userId: string, cursor?: string, limit?: number): Promise<import("../utils/pagination").CursorPage<{
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
    createPost(authorId: string, data: {
        content: string;
        mediaUrls?: string[];
        mediaType?: string;
        videoUrl?: string;
        videoFileName?: string;
        mimeType?: string;
        fileSize?: number;
        communityId?: string;
        isDraft?: boolean;
        scheduledAt?: Date | null;
        tags?: string[];
    }): Promise<{
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
    }>;
    getPost(postId: string, viewerId?: string): Promise<{
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
        likes: {
            id: string;
        }[];
        bookmarks: {
            id: string;
        }[];
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
    }>;
    updatePost(postId: string, userId: string, data: {
        content?: string;
        isDraft?: boolean;
    }): Promise<{
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
    }>;
    deletePost(postId: string, userId: string, role: string): Promise<void>;
    publishDraft(postId: string, userId: string): Promise<{
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
    }>;
    getDrafts(userId: string, cursor?: string, limit?: number): Promise<import("../utils/pagination").CursorPage<{
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
    likePost(postId: string, userId: string): Promise<void>;
    unlikePost(postId: string, userId: string): Promise<void>;
    getTrendingPosts(userId: string, cursor?: string, limit?: number): Promise<import("../utils/pagination").CursorPage<{
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
};
//# sourceMappingURL=posts.service.d.ts.map
export declare const bookmarksService: {
    addBookmark(userId: string, postId: string): Promise<void>;
    removeBookmark(userId: string, postId: string): Promise<void>;
    getBookmarks(userId: string, cursor?: string, limit?: number): Promise<import("../utils/pagination").CursorPage<{
        community: {
            name: string;
            id: string;
            slug: string;
        };
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
};
//# sourceMappingURL=bookmarks.service.d.ts.map
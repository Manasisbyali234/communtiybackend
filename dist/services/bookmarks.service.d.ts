export declare const bookmarksService: {
    addBookmark(userId: string, postId: string): Promise<void>;
    removeBookmark(userId: string, postId: string): Promise<void>;
    getBookmarks(userId: string, cursor?: string, limit?: number): Promise<import("../utils/pagination").CursorPage<{
        community: {
            name: string;
            id: string;
            slug: string;
        } | null;
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
};
//# sourceMappingURL=bookmarks.service.d.ts.map
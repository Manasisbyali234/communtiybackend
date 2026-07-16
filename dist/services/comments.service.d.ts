export declare const commentsService: {
    getComments(postId: string, parentId: string | null, cursor?: string, limit?: number): Promise<import("../utils/pagination").CursorPage<{
        id: string;
        createdAt: Date;
        _count: {
            replies: number;
        };
        content: string;
        likesCount: number;
        author: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        };
        parentId: string | null;
    }>>;
    addComment(postId: string, authorId: string, content: string, parentId?: string): Promise<{
        id: string;
        createdAt: Date;
        _count: {
            replies: number;
        };
        content: string;
        likesCount: number;
        author: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        };
        parentId: string | null;
    }>;
    updateComment(commentId: string, userId: string, content: string): Promise<{
        id: string;
        createdAt: Date;
        _count: {
            replies: number;
        };
        content: string;
        likesCount: number;
        author: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        };
        parentId: string | null;
    }>;
    deleteComment(commentId: string, postId: string, userId: string, role: string): Promise<void>;
    likeComment(commentId: string, userId: string): Promise<void>;
};
//# sourceMappingURL=comments.service.d.ts.map
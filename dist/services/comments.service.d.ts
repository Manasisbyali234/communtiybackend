export declare const commentsService: {
    getComments(postId: string, parentId: string | null, userId: string, cursor?: string, limit?: number): Promise<{
        data: {
            isLiked: boolean;
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
                avatarUrl: string;
            };
            parentId: string;
        }[];
        nextCursor: string | null;
        hasMore: boolean;
    }>;
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
            avatarUrl: string;
        };
        parentId: string;
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
            avatarUrl: string;
        };
        parentId: string;
    }>;
    deleteComment(commentId: string, postId: string, userId: string, role: string): Promise<void>;
    likeComment(commentId: string, userId: string): Promise<{
        isLiked: boolean;
        likesCount: number;
    }>;
};
//# sourceMappingURL=comments.service.d.ts.map
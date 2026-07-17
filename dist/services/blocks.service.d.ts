export declare const blocksService: {
    blockUser(blockerId: string, blockedId: string): Promise<void>;
    unblockUser(blockerId: string, blockedId: string): Promise<void>;
    isBlocked(blockerId: string, blockedId: string): Promise<boolean>;
    getBlockedUsers(userId: string, cursor?: string, limit?: number): Promise<import("../utils/pagination").CursorPage<{
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
    }>>;
    /**
     * Returns blocked user IDs (both directions) for filtering feeds/search.
     */
    getBlockedIds(userId: string): Promise<string[]>;
};
//# sourceMappingURL=blocks.service.d.ts.map
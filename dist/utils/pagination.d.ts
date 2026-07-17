export interface CursorPage<T> {
    data: T[];
    nextCursor: string | null;
    hasMore: boolean;
}
export declare function encodeCursor(id: string): string;
export declare function decodeCursor(cursor: string): string;
export interface PaginationArgs {
    cursor?: string | undefined;
    limit: number;
}
/**
 * Build a Prisma-compatible take/skip/cursor args object.
 */
export declare function buildCursorArgs(args: PaginationArgs): {
    take: number;
    skip: number;
    cursor?: {
        id: string;
    };
};
/**
 * Slice the extra item and build a cursor page result.
 */
export declare function buildCursorPage<T extends {
    id: string;
}>(items: T[], limit: number): CursorPage<T>;
//# sourceMappingURL=pagination.d.ts.map
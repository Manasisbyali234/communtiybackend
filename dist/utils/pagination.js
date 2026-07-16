"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeCursor = encodeCursor;
exports.decodeCursor = decodeCursor;
exports.buildCursorArgs = buildCursorArgs;
exports.buildCursorPage = buildCursorPage;
function encodeCursor(id) {
    return Buffer.from(id).toString('base64url');
}
function decodeCursor(cursor) {
    return Buffer.from(cursor, 'base64url').toString('utf8');
}
/**
 * Build a Prisma-compatible take/skip/cursor args object.
 */
function buildCursorArgs(args) {
    return {
        take: args.limit + 1, // fetch one extra to detect hasMore
        skip: args.cursor ? 1 : 0,
        ...(args.cursor ? { cursor: { id: decodeCursor(args.cursor) } } : {}),
    };
}
/**
 * Slice the extra item and build a cursor page result.
 */
function buildCursorPage(items, limit) {
    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;
    const lastItem = data.at(-1);
    return {
        data,
        hasMore,
        nextCursor: hasMore && lastItem ? encodeCursor(lastItem.id) : null,
    };
}
//# sourceMappingURL=pagination.js.map
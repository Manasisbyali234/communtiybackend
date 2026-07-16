export interface CursorPage<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function encodeCursor(id: string): string {
  return Buffer.from(id).toString('base64url');
}

export function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64url').toString('utf8');
}

export interface PaginationArgs {
  cursor?: string | undefined;
  limit: number;
}

/**
 * Build a Prisma-compatible take/skip/cursor args object.
 */
export function buildCursorArgs(args: PaginationArgs): {
  take: number;
  skip: number;
  cursor?: { id: string };
} {
  return {
    take: args.limit + 1, // fetch one extra to detect hasMore
    skip: args.cursor ? 1 : 0,
    ...(args.cursor ? { cursor: { id: decodeCursor(args.cursor) } } : {}),
  };
}

/**
 * Slice the extra item and build a cursor page result.
 */
export function buildCursorPage<T extends { id: string }>(
  items: T[],
  limit: number,
): CursorPage<T> {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const lastItem = data.at(-1);
  return {
    data,
    hasMore,
    nextCursor: hasMore && lastItem ? encodeCursor(lastItem.id) : null,
  };
}

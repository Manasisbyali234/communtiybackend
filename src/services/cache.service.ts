import { prisma } from '../config/database';
import { logger } from '../config/logger';

export const cacheService = {
  /**
   * Set a key-value pair in the database cache
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      const expiresAt = ttlSeconds ? new Date(Date.now() + ttlSeconds * 1000) : null;

      await prisma.cacheEntry.upsert({
        where: { key },
        update: { value: stringValue, expiresAt, updatedAt: new Date() },
        create: { key, value: stringValue, expiresAt },
      });
    } catch (error) {
      logger.error({ error, key }, 'Failed to set cache entry');
      throw error;
    }
  },

  /**
   * Get a value from the database cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const entry = await prisma.cacheEntry.findUnique({
        where: { key },
      });

      if (!entry) return null;

      // Check if expired
      if (entry.expiresAt && entry.expiresAt < new Date()) {
        await this.delete(key);
        return null;
      }

      try {
        return JSON.parse(entry.value);
      } catch {
        // Return as string if not valid JSON
        return entry.value as T;
      }
    } catch (error) {
      logger.error({ error, key }, 'Failed to get cache entry');
      return null;
    }
  },

  /**
   * Delete a key from the database cache
   */
  async delete(key: string): Promise<void> {
    try {
      await prisma.cacheEntry.deleteMany({
        where: { key },
      });
    } catch (error) {
      logger.error({ error, key }, 'Failed to delete cache entry');
      throw error;
    }
  },

  /**
   * Delete multiple keys by pattern (basic pattern matching)
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      const likePattern = pattern.replace('*', '%');
      await prisma.$executeRaw`
        DELETE FROM "CacheEntry" WHERE key LIKE ${likePattern}
      `;
    } catch (error) {
      logger.error({ error, pattern }, 'Failed to delete cache entries by pattern');
      throw error;
    }
  },

  /**
   * Check if a key exists in the cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      const entry = await prisma.cacheEntry.findUnique({
        where: { key },
        select: { key: true, expiresAt: true },
      });

      if (!entry) return false;

      // Check if expired
      if (entry.expiresAt && entry.expiresAt < new Date()) {
        await this.delete(key);
        return false;
      }

      return true;
    } catch (error) {
      logger.error({ error, key }, 'Failed to check cache entry existence');
      return false;
    }
  },

  /**
   * Set expiry for an existing key
   */
  async expire(key: string, ttlSeconds: number): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      await prisma.cacheEntry.update({
        where: { key },
        data: { expiresAt },
      });
    } catch (error) {
      logger.error({ error, key, ttlSeconds }, 'Failed to set cache entry expiry');
      throw error;
    }
  },

  /**
   * Get multiple keys at once
   */
  async mget(keys: string[]): Promise<(any | null)[]> {
    try {
      await this.cleanup();

      const entries = await prisma.cacheEntry.findMany({
        where: { key: { in: keys } },
      });

      return keys.map(key => {
        const entry = entries.find(e => e.key === key);
        if (!entry) return null;

        // Check if expired
        if (entry.expiresAt && entry.expiresAt < new Date()) {
          this.delete(key); // Async cleanup, don't await
          return null;
        }

        try {
          return JSON.parse(entry.value);
        } catch {
          return entry.value;
        }
      });
    } catch (error) {
      logger.error({ error, keys }, 'Failed to get multiple cache entries');
      return keys.map(() => null);
    }
  },

  /**
   * Set multiple key-value pairs at once
   */
  async mset(entries: Array<{ key: string; value: any; ttlSeconds?: number }>): Promise<void> {
    try {
      const data = entries.map(({ key, value, ttlSeconds }) => {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        const expiresAt = ttlSeconds ? new Date(Date.now() + ttlSeconds * 1000) : null;
        return { key, value: stringValue, expiresAt };
      });

      // Use a transaction to insert/update all entries
      await prisma.$transaction(
        data.map(entry =>
          prisma.cacheEntry.upsert({
            where: { key: entry.key },
            update: { value: entry.value, expiresAt: entry.expiresAt, updatedAt: new Date() },
            create: entry,
          })
        )
      );
    } catch (error) {
      logger.error({ error, entryCount: entries.length }, 'Failed to set multiple cache entries');
      throw error;
    }
  },

  /**
   * Clean up expired entries (run periodically)
   */
  async cleanup(): Promise<void> {
    try {
      const result = await prisma.cacheEntry.deleteMany({
        where: {
          expiresAt: {
            lte: new Date(),
          },
        },
      });

      if (result.count > 0) {
        logger.info({ deletedCount: result.count }, 'Cleaned up expired cache entries');
      }
    } catch (error) {
      logger.error({ error }, 'Failed to cleanup expired cache entries');
    }
  },

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      await prisma.cacheEntry.deleteMany({});
      logger.info('Cleared all cache entries');
    } catch (error) {
      logger.error({ error }, 'Failed to clear cache entries');
      throw error;
    }
  },

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ total: number; expired: number }> {
    try {
      const now = new Date();
      const [total, expired] = await Promise.all([
        prisma.cacheEntry.count(),
        prisma.cacheEntry.count({
          where: { expiresAt: { lte: now } }
        }),
      ]);

      return { total, expired };
    } catch (error) {
      logger.error({ error }, 'Failed to get cache statistics');
      return { total: 0, expired: 0 };
    }
  },
};

// Cleanup expired entries every 10 minutes
setInterval(() => {
  cacheService.cleanup().catch(err => 
    logger.error({ err }, 'Background cache cleanup failed')
  );
}, 10 * 60 * 1000);
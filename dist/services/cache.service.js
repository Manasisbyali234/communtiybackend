"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = void 0;
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
exports.cacheService = {
    /**
     * Set a key-value pair in the database cache
     */
    async set(key, value, ttlSeconds) {
        try {
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            const expiresAt = ttlSeconds ? new Date(Date.now() + ttlSeconds * 1000) : null;
            await database_1.prisma.cacheEntry.upsert({
                where: { key },
                update: { value: stringValue, expiresAt, updatedAt: new Date() },
                create: { key, value: stringValue, expiresAt },
            });
        }
        catch (error) {
            logger_1.logger.error({ error, key }, 'Failed to set cache entry');
            throw error;
        }
    },
    /**
     * Get a value from the database cache
     */
    async get(key) {
        try {
            // Clean up expired entries
            await this.cleanup();
            const entry = await database_1.prisma.cacheEntry.findUnique({
                where: { key },
            });
            if (!entry)
                return null;
            // Check if expired
            if (entry.expiresAt && entry.expiresAt < new Date()) {
                await this.delete(key);
                return null;
            }
            try {
                return JSON.parse(entry.value);
            }
            catch {
                // Return as string if not valid JSON
                return entry.value;
            }
        }
        catch (error) {
            logger_1.logger.error({ error, key }, 'Failed to get cache entry');
            return null;
        }
    },
    /**
     * Delete a key from the database cache
     */
    async delete(key) {
        try {
            await database_1.prisma.cacheEntry.delete({
                where: { key },
            });
        }
        catch (error) {
            // Ignore if key doesn't exist
            if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
                return;
            }
            logger_1.logger.error({ error, key }, 'Failed to delete cache entry');
            throw error;
        }
    },
    /**
     * Delete multiple keys by pattern (basic pattern matching)
     */
    async deletePattern(pattern) {
        try {
            const likePattern = pattern.replace('*', '%');
            await database_1.prisma.$executeRaw `
        DELETE FROM "CacheEntry" WHERE key LIKE ${likePattern}
      `;
        }
        catch (error) {
            logger_1.logger.error({ error, pattern }, 'Failed to delete cache entries by pattern');
            throw error;
        }
    },
    /**
     * Check if a key exists in the cache
     */
    async exists(key) {
        try {
            const entry = await database_1.prisma.cacheEntry.findUnique({
                where: { key },
                select: { key: true, expiresAt: true },
            });
            if (!entry)
                return false;
            // Check if expired
            if (entry.expiresAt && entry.expiresAt < new Date()) {
                await this.delete(key);
                return false;
            }
            return true;
        }
        catch (error) {
            logger_1.logger.error({ error, key }, 'Failed to check cache entry existence');
            return false;
        }
    },
    /**
     * Set expiry for an existing key
     */
    async expire(key, ttlSeconds) {
        try {
            const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
            await database_1.prisma.cacheEntry.update({
                where: { key },
                data: { expiresAt },
            });
        }
        catch (error) {
            logger_1.logger.error({ error, key, ttlSeconds }, 'Failed to set cache entry expiry');
            throw error;
        }
    },
    /**
     * Get multiple keys at once
     */
    async mget(keys) {
        try {
            await this.cleanup();
            const entries = await database_1.prisma.cacheEntry.findMany({
                where: { key: { in: keys } },
            });
            return keys.map(key => {
                const entry = entries.find(e => e.key === key);
                if (!entry)
                    return null;
                // Check if expired
                if (entry.expiresAt && entry.expiresAt < new Date()) {
                    this.delete(key); // Async cleanup, don't await
                    return null;
                }
                try {
                    return JSON.parse(entry.value);
                }
                catch {
                    return entry.value;
                }
            });
        }
        catch (error) {
            logger_1.logger.error({ error, keys }, 'Failed to get multiple cache entries');
            return keys.map(() => null);
        }
    },
    /**
     * Set multiple key-value pairs at once
     */
    async mset(entries) {
        try {
            const data = entries.map(({ key, value, ttlSeconds }) => {
                const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
                const expiresAt = ttlSeconds ? new Date(Date.now() + ttlSeconds * 1000) : null;
                return { key, value: stringValue, expiresAt };
            });
            // Use a transaction to insert/update all entries
            await database_1.prisma.$transaction(data.map(entry => database_1.prisma.cacheEntry.upsert({
                where: { key: entry.key },
                update: { value: entry.value, expiresAt: entry.expiresAt, updatedAt: new Date() },
                create: entry,
            })));
        }
        catch (error) {
            logger_1.logger.error({ error, entryCount: entries.length }, 'Failed to set multiple cache entries');
            throw error;
        }
    },
    /**
     * Clean up expired entries (run periodically)
     */
    async cleanup() {
        try {
            const result = await database_1.prisma.cacheEntry.deleteMany({
                where: {
                    expiresAt: {
                        lte: new Date(),
                    },
                },
            });
            if (result.count > 0) {
                logger_1.logger.info({ deletedCount: result.count }, 'Cleaned up expired cache entries');
            }
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Failed to cleanup expired cache entries');
        }
    },
    /**
     * Clear all cache entries
     */
    async clear() {
        try {
            await database_1.prisma.cacheEntry.deleteMany({});
            logger_1.logger.info('Cleared all cache entries');
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Failed to clear cache entries');
            throw error;
        }
    },
    /**
     * Get cache statistics
     */
    async getStats() {
        try {
            const now = new Date();
            const [total, expired] = await Promise.all([
                database_1.prisma.cacheEntry.count(),
                database_1.prisma.cacheEntry.count({
                    where: { expiresAt: { lte: now } }
                }),
            ]);
            return { total, expired };
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Failed to get cache statistics');
            return { total: 0, expired: 0 };
        }
    },
};
// Cleanup expired entries every 10 minutes
setInterval(() => {
    exports.cacheService.cleanup().catch(err => logger_1.logger.error({ err }, 'Background cache cleanup failed'));
}, 10 * 60 * 1000);
//# sourceMappingURL=cache.service.js.map
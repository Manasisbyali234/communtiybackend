export declare const cacheService: {
    /**
     * Set a key-value pair in the database cache
     */
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    /**
     * Get a value from the database cache
     */
    get<T = any>(key: string): Promise<T | null>;
    /**
     * Delete a key from the database cache
     */
    delete(key: string): Promise<void>;
    /**
     * Delete multiple keys by pattern (basic pattern matching)
     */
    deletePattern(pattern: string): Promise<void>;
    /**
     * Check if a key exists in the cache
     */
    exists(key: string): Promise<boolean>;
    /**
     * Set expiry for an existing key
     */
    expire(key: string, ttlSeconds: number): Promise<void>;
    /**
     * Get multiple keys at once
     */
    mget(keys: string[]): Promise<(any | null)[]>;
    /**
     * Set multiple key-value pairs at once
     */
    mset(entries: Array<{
        key: string;
        value: any;
        ttlSeconds?: number;
    }>): Promise<void>;
    /**
     * Clean up expired entries (run periodically)
     */
    cleanup(): Promise<void>;
    /**
     * Clear all cache entries
     */
    clear(): Promise<void>;
    /**
     * Get cache statistics
     */
    getStats(): Promise<{
        total: number;
        expired: number;
    }>;
};
//# sourceMappingURL=cache.service.d.ts.map
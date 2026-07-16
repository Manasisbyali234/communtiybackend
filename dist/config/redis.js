"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
exports.connectRedis = connectRedis;
const logger_1 = require("../config/logger");
const cache_service_1 = require("../services/cache.service");
// Use database cache instead of Redis
exports.redis = {
    async set(key, value, mode, ttl) {
        const ttlSeconds = mode === 'EX' ? ttl : undefined;
        await cache_service_1.cacheService.set(key, value, ttlSeconds);
    },
    async get(key) {
        return await cache_service_1.cacheService.get(key);
    },
    async del(...keys) {
        await Promise.all(keys.map(key => cache_service_1.cacheService.delete(key)));
    },
    async exists(key) {
        return (await cache_service_1.cacheService.exists(key)) ? 1 : 0;
    },
    async expire(key, seconds) {
        await cache_service_1.cacheService.expire(key, seconds);
    },
    async mget(...keys) {
        return await cache_service_1.cacheService.mget(keys);
    },
    async setex(key, seconds, value) {
        await cache_service_1.cacheService.set(key, value, seconds);
    },
    async flushall() {
        await cache_service_1.cacheService.clear();
    },
    async ping() {
        return 'PONG';
    },
    async quit() {
        // No-op for PostgreSQL cache
    },
    on(event, callback) {
        // Stub for Redis event listeners
        if (event === 'connect') {
            setTimeout(() => callback(), 100);
        }
    },
};
async function connectRedis() {
    logger_1.logger.info('Using PostgreSQL-based cache service instead of Redis');
}
//# sourceMappingURL=redis.js.map
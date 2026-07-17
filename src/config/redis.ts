import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { cacheService } from '../services/cache.service';

// Use database cache instead of Redis
export const redis = {
  async set(key: string, value: any, mode?: string, ttl?: number): Promise<void> {
    const ttlSeconds = mode === 'EX' ? ttl : undefined;
    await cacheService.set(key, value, ttlSeconds);
  },

  async get(key: string): Promise<string | null> {
    return await cacheService.get(key);
  },

  async del(...keys: string[]): Promise<void> {
    await Promise.all(keys.map(key => cacheService.delete(key)));
  },

  async exists(key: string): Promise<number> {
    return (await cacheService.exists(key)) ? 1 : 0;
  },

  async expire(key: string, seconds: number): Promise<void> {
    await cacheService.expire(key, seconds);
  },

  async mget(...keys: string[]): Promise<(string | null)[]> {
    return await cacheService.mget(keys);
  },

  async setex(key: string, seconds: number, value: any): Promise<void> {
    await cacheService.set(key, value, seconds);
  },

  async flushall(): Promise<void> {
    await cacheService.clear();
  },

  async ping(): Promise<string> {
    return 'PONG';
  },

  async quit(): Promise<void> {
    // No-op for PostgreSQL cache
  },

  on(event: string, callback: (err?: Error) => void): void {
    // Stub for Redis event listeners
    if (event === 'connect') {
      setTimeout(() => callback(), 100);
    }
  },
};

export async function connectRedis(): Promise<void> {
  logger.info('Using PostgreSQL-based cache service instead of Redis');
}

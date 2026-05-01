import { redis } from './redis';

export class CacheService {
  static async get<T>(tenantId: string, key: string): Promise<T | null> {
    const cacheKey = `tenant:${tenantId}:${key}`;
    return await redis.get<T>(cacheKey);
  }

  static async set(tenantId: string, key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    const cacheKey = `tenant:${tenantId}:${key}`;
    await redis.set(cacheKey, value, { ex: ttlSeconds });
  }

  static async invalidate(tenantId: string, pattern: string): Promise<void> {
    const cachePattern = `tenant:${tenantId}:${pattern}`;
    
    // In Upstash REST, to delete by pattern, we often have to SCAN/KEYS then DEL.
    const keys = await redis.keys(cachePattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  static async invalidateExact(tenantId: string, key: string): Promise<void> {
    const cacheKey = `tenant:${tenantId}:${key}`;
    await redis.del(cacheKey);
  }
}

import { Injectable } from '@nestjs/common';
import { RedisService } from '../../common/redis/redis.service.js';
import { RedirectCache, type RedirectCachePayload } from './redirect-cache.js';

const REDIRECT_CACHE_PREFIX = 'links:redirect:';
const REDIRECT_CACHE_TTL_SECONDS = 15 * 60; // 15 minutes

@Injectable()
export class RedisRedirectCache extends RedirectCache {
  constructor(private readonly redis: RedisService) {
    super();
  }

  /**
   * Retrieves redirect cache payload for a given short code.
   */
  async get(shortCode: string): Promise<RedirectCachePayload | null> {
    const cached = await this.redis.get(this.key(shortCode));
    if (!cached) return null;
    try {
      return JSON.parse(cached) as RedirectCachePayload;
    } catch {
      return null;
    }
  }

  /**
   * Stores redirect cache payload for a given short code with an appropriate TTL based on expiresAt.
   * Fails silently if TTL is non-positive to avoid caching already expired links.
   */
  async set(shortCode: string, payload: RedirectCachePayload): Promise<void> {
    const ttlSeconds = this.ttl(payload.expiresAt);
    if (ttlSeconds <= 0) return;
    await this.redis.set(
      this.key(shortCode),
      JSON.stringify(payload),
      ttlSeconds,
    );
  }

  /**
   * Deletes redirect cache for a given short code.
   * Called when a link is updated or deleted to ensure stale data isn't served.
   */
  async del(shortCode: string): Promise<void> {
    await this.redis.del(this.key(shortCode));
  }

  /**
   * Returns redis key for a given short code, namespaced with REDIRECT_CACHE_PREFIX.
   */
  private key(shortCode: string): string {
    return `${REDIRECT_CACHE_PREFIX}${shortCode}`;
  }

  /**
   * Calculate TTL in seconds based on expiresAt.
   * Defaults to REDIRECT_CACHE_TTL_SECONDS if expiresAt is null or in the future.
   */
  private ttl(expiresAt: string | null): number {
    if (!expiresAt) return REDIRECT_CACHE_TTL_SECONDS;
    const secondsUntilExpiry = Math.floor(
      (new Date(expiresAt).getTime() - Date.now()) / 1000,
    );
    return Math.min(REDIRECT_CACHE_TTL_SECONDS, secondsUntilExpiry);
  }
}

import {
  BadRequestException,
  GoneException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import type { AppConfig } from '../app.config.js';

const BASE62_ALPHABET =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BASE62_PATTERN = /^[0-9a-zA-Z]+$/;
const COUNTER_KEY = 'links:counter';
const REDIRECT_CACHE_PREFIX = 'links:redirect:';
const REDIRECT_CACHE_TTL_SECONDS = 15 * 60;

interface RedirectCachePayload {
  originalUrl: string;
  isActive: boolean;
  expiresAt: string | null;
}

@Injectable()
export class LinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async create(userId: string, originalUrl: string) {
    this.validateOriginalUrl(originalUrl);

    const shortCode = await this.generateShortCode();

    try {
      const link = await this.prisma.link.create({
        data: {
          userId,
          shortCode,
          originalUrl,
          isActive: true,
          expiresAt: null,
        },
        select: {
          id: true,
          shortCode: true,
          originalUrl: true,
          isActive: true,
          expiresAt: true,
          createdAt: true,
        },
      });

      await this.cacheRedirectPayload(shortCode, {
        originalUrl: link.originalUrl,
        isActive: link.isActive,
        expiresAt: link.expiresAt?.toISOString() ?? null,
      });

      return {
        ...link,
        shortUrl: this.buildShortUrl(shortCode),
      };
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ServiceUnavailableException(
          'Short-code counter state is invalid',
        );
      }
      throw error;
    }
  }

  async resolveRedirect(shortCode: string) {
    if (!BASE62_PATTERN.test(shortCode)) throw new NotFoundException();

    const cached = await this.getCachedRedirectPayload(shortCode);
    if (cached) return this.resolvePayload(cached);

    const link = await this.prisma.link.findUnique({
      where: { shortCode },
      select: {
        originalUrl: true,
        isActive: true,
        expiresAt: true,
      },
    });

    if (!link) throw new NotFoundException();

    const payload = {
      originalUrl: link.originalUrl,
      isActive: link.isActive,
      expiresAt: link.expiresAt?.toISOString() ?? null,
    };

    await this.cacheRedirectPayload(shortCode, payload);
    return this.resolvePayload(payload);
  }

  private validateOriginalUrl(originalUrl: string) {
    if (originalUrl.trim() !== originalUrl) {
      throw new BadRequestException(
        'originalUrl must not include leading or trailing whitespace',
      );
    }

    let parsed: URL;
    try {
      parsed = new URL(originalUrl);
    } catch {
      throw new BadRequestException('originalUrl must be an absolute URL');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new BadRequestException('originalUrl must use http or https');
    }
  }

  private async generateShortCode() {
    const redis = this.redisService.getClient();

    try {
      const counterExists = await redis.exists(COUNTER_KEY);
      if (!counterExists) {
        const linkCount = await this.prisma.link.count();
        if (linkCount > 0) {
          throw new ServiceUnavailableException(
            'Short-code counter is not initialized',
          );
        }
        await redis.set(COUNTER_KEY, '0', { NX: true });
      }

      const counter = await redis.incr(COUNTER_KEY);
      return this.encodeBase62(counter);
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException(
        'Short-code counter is unavailable',
      );
    }
  }

  private encodeBase62(value: number) {
    if (value === 0) return BASE62_ALPHABET[0];

    let remaining = value;
    let encoded = '';
    while (remaining > 0) {
      encoded = BASE62_ALPHABET[remaining % 62] + encoded;
      remaining = Math.floor(remaining / 62);
    }
    return encoded;
  }

  private async getCachedRedirectPayload(shortCode: string) {
    try {
      const cached = await this.redisService
        .getClient()
        .get(this.getRedirectCacheKey(shortCode));
      if (!cached) return null;
      return JSON.parse(cached) as RedirectCachePayload;
    } catch {
      return null;
    }
  }

  private async cacheRedirectPayload(
    shortCode: string,
    payload: RedirectCachePayload,
  ) {
    const ttlSeconds = this.getCacheTtlSeconds(payload.expiresAt);
    if (ttlSeconds <= 0) return;

    try {
      await this.redisService
        .getClient()
        .set(this.getRedirectCacheKey(shortCode), JSON.stringify(payload), {
          EX: ttlSeconds,
        });
    } catch {
      return;
    }
  }

  private getCacheTtlSeconds(expiresAt: string | null) {
    if (!expiresAt) return REDIRECT_CACHE_TTL_SECONDS;

    const secondsUntilExpiry = Math.floor(
      (new Date(expiresAt).getTime() - Date.now()) / 1000,
    );
    return Math.min(REDIRECT_CACHE_TTL_SECONDS, secondsUntilExpiry);
  }

  private resolvePayload(payload: RedirectCachePayload) {
    if (!payload.isActive) throw new NotFoundException();
    if (
      payload.expiresAt &&
      new Date(payload.expiresAt).getTime() <= Date.now()
    ) {
      throw new GoneException();
    }
    return payload.originalUrl;
  }

  private getRedirectCacheKey(shortCode: string) {
    return `${REDIRECT_CACHE_PREFIX}${shortCode}`;
  }

  private buildShortUrl(shortCode: string) {
    return new URL(
      `/api/v1/links/${shortCode}`,
      this.configService.getOrThrow<AppConfig>('app').shortLinkBaseUrl,
    ).toString();
  }

  private isUniqueConstraintError(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}

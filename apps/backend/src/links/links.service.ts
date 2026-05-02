import {
  GoneException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import type { AppConfig } from '../app.config.js';
import { ShortCodeGenerator } from './short-code-generator.js';

const BASE62_PATTERN = /^[0-9a-zA-Z]+$/;
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
    private readonly shortCodeGenerator: ShortCodeGenerator,
  ) {}

  async create(userId: string, originalUrl: string) {
    const shortCode = await this.shortCodeGenerator.next();

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

  private async getCachedRedirectPayload(
    shortCode: string,
  ): Promise<RedirectCachePayload | null> {
    const cached = await this.redisService.get(
      this.getRedirectCacheKey(shortCode),
    );
    if (!cached) return null;
    try {
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

    await this.redisService.set(
      this.getRedirectCacheKey(shortCode),
      JSON.stringify(payload),
      ttlSeconds,
    );
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

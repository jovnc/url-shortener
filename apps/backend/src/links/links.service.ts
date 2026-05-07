import {
  BadRequestException,
  ConflictException,
  GoneException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/database/prisma.service.js';
import { RedisService } from '../common/redis/redis.service.js';
import type { AppConfig } from '../app.config.js';
import { ShortCodeGenerator } from './short-code-generator.js';

const SHORT_CODE_PATTERN = /^[0-9a-zA-Z-]+$/;
const RESERVED_CODES = new Set([
  'api',
  'auth',
  'health',
  'links',
  'login',
  'logout',
  'me',
]);
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

  async findAllByUser(userId: string) {
    const links = await this.prisma.link.findMany({
      where: { userId },
      select: {
        id: true,
        shortCode: true,
        originalUrl: true,
        isActive: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return links.map((link) => ({
      ...link,
      shortUrl: this.buildShortUrl(link.shortCode),
    }));
  }

  async create(
    userId: string,
    originalUrl: string,
    expiresAt?: string,
    customShortCode?: string,
  ) {
    if (customShortCode && RESERVED_CODES.has(customShortCode.toLowerCase())) {
      throw new BadRequestException('That short code is reserved');
    }

    const shortCode = customShortCode ?? (await this.shortCodeGenerator.next());
    const expiry = this.parseFutureExpiry(expiresAt);

    try {
      const link = await this.prisma.link.create({
        data: {
          userId,
          shortCode,
          originalUrl,
          isActive: true,
          expiresAt: expiry,
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
        if (customShortCode) {
          throw new ConflictException('That short code is already taken');
        }
        throw new ServiceUnavailableException(
          'Short-code counter state is invalid',
        );
      }
      throw error;
    }
  }

  async delete(userId: string, linkId: string) {
    const link = await this.prisma.link.findFirst({
      where: { id: linkId, userId },
      select: { id: true, shortCode: true, isActive: true },
    });

    if (!link) throw new NotFoundException();

    if (link.isActive) {
      await this.prisma.link.update({
        where: { id: link.id },
        data: { isActive: false },
      });
    }

    await this.redisService.del(this.getRedirectCacheKey(link.shortCode));
  }

  async resolveRedirect(shortCode: string) {
    if (!SHORT_CODE_PATTERN.test(shortCode)) throw new NotFoundException();

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
    if (!payload.isActive) throw new GoneException();
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
      `/${shortCode}`,
      this.configService.getOrThrow<AppConfig>('app').shortLinkBaseUrl,
    ).toString();
  }

  private parseFutureExpiry(expiresAt?: string) {
    if (!expiresAt) return null;

    const expiry = new Date(expiresAt);
    if (expiry.getTime() <= Date.now()) {
      throw new BadRequestException('expiresAt must be in the future');
    }
    return expiry;
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

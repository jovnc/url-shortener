/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method */
import {
  BadRequestException,
  ConflictException,
  GoneException,
} from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { mock, mockDeep } from 'vitest-mock-extended';
import { LinksService } from './links.service.js';

interface PrismaMock {
  link: {
    findMany(args: unknown): Promise<unknown[]>;
    create(args: unknown): Promise<any>;
    findFirst(args: unknown): Promise<any>;
    update(args: unknown): Promise<any>;
    findUnique(args: unknown): Promise<any>;
  };
}

interface RedisMock {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}

interface ConfigMock {
  getOrThrow(key: string): { shortLinkBaseUrl: string };
}

interface ShortCodeGeneratorMock {
  next(): Promise<string>;
}

describe('LinksService', () => {
  const createService = () => {
    const prisma = mockDeep<PrismaMock>();
    const redis = mock<RedisMock>();
    const config = mock<ConfigMock>();
    const shortCodeGenerator = mock<ShortCodeGeneratorMock>();
    config.getOrThrow.mockReturnValue({ shortLinkBaseUrl: 'https://sho.rt' });

    return {
      prisma,
      redis,
      config,
      shortCodeGenerator,
      service: new LinksService(
        prisma as any,
        redis as any,
        config as any,
        shortCodeGenerator as any,
      ),
    };
  };

  it('creates a generated short link and caches its redirect payload', async () => {
    const { service, prisma, redis, shortCodeGenerator } = createService();
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    shortCodeGenerator.next.mockResolvedValue('abc123');
    prisma.link.create.mockResolvedValue({
      id: 'link-id',
      shortCode: 'abc123',
      originalUrl: 'https://example.com',
      isActive: true,
      expiresAt: null,
      createdAt,
    });

    await expect(
      service.create('user-id', 'https://example.com'),
    ).resolves.toEqual({
      id: 'link-id',
      shortCode: 'abc123',
      originalUrl: 'https://example.com',
      isActive: true,
      expiresAt: null,
      createdAt,
      shortUrl: 'https://sho.rt/abc123',
    });

    expect(prisma.link.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-id',
          shortCode: 'abc123',
          originalUrl: 'https://example.com',
          isActive: true,
          expiresAt: null,
        }),
      }),
    );
    expect(redis.set).toHaveBeenCalledWith(
      'links:redirect:abc123',
      JSON.stringify({
        originalUrl: 'https://example.com',
        isActive: true,
        expiresAt: null,
      }),
      900,
    );
  });

  it('rejects reserved custom short codes', async () => {
    const { service, prisma, shortCodeGenerator } = createService();

    await expect(
      service.create('user-id', 'https://example.com', undefined, 'api'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(shortCodeGenerator.next).not.toHaveBeenCalled();
    expect(prisma.link.create).not.toHaveBeenCalled();
  });

  it('maps custom short-code collisions to conflict errors', async () => {
    const { service, prisma } = createService();
    prisma.link.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.create('user-id', 'https://example.com', undefined, 'mine'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('resolves active cached redirects without querying Prisma', async () => {
    const { service, prisma, redis } = createService();
    redis.get.mockResolvedValue(
      JSON.stringify({
        originalUrl: 'https://example.com',
        isActive: true,
        expiresAt: null,
      }),
    );

    await expect(service.resolveRedirect('abc123')).resolves.toBe(
      'https://example.com',
    );

    expect(prisma.link.findUnique).not.toHaveBeenCalled();
  });

  it('rejects inactive or expired redirects', async () => {
    const { service, redis } = createService();
    redis.get.mockResolvedValue(
      JSON.stringify({
        originalUrl: 'https://example.com',
        isActive: false,
        expiresAt: null,
      }),
    );

    await expect(service.resolveRedirect('abc123')).rejects.toBeInstanceOf(
      GoneException,
    );

    redis.get.mockResolvedValue(
      JSON.stringify({
        originalUrl: 'https://example.com',
        isActive: true,
        expiresAt: '2020-01-01T00:00:00.000Z',
      }),
    );

    await expect(service.resolveRedirect('abc123')).rejects.toBeInstanceOf(
      GoneException,
    );
  });

  it('deactivates an active link and clears its redirect cache on delete', async () => {
    const { service, prisma, redis } = createService();
    prisma.link.findFirst.mockResolvedValue({
      id: 'link-id',
      shortCode: 'abc123',
      isActive: true,
    });

    await expect(service.delete('user-id', 'link-id')).resolves.toBeUndefined();

    expect(prisma.link.update).toHaveBeenCalledWith({
      where: { id: 'link-id' },
      data: { isActive: false },
    });
    expect(redis.del).toHaveBeenCalledWith('links:redirect:abc123');
  });
});

import {
  BadRequestException,
  ConflictException,
  GoneException,
} from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import {
  createConfigMock,
  createPrismaMock,
} from '../common/test-utils/mocks.js';
import { LinksService } from './links.service.js';
import type { ShortCodeGenerator } from './short-code/short-code-generator.js';
import type { RedirectCache } from './redirect-cache/redirect-cache.js';

const createRedirectCacheMock = () => mock<RedirectCache>();
const createShortCodeGeneratorMock = () => mock<ShortCodeGenerator>();

describe('LinksService', () => {
  // Helper function to create a service instance with mocked dependencies
  const createService = () => {
    const prisma = createPrismaMock();
    const redirectCache = createRedirectCacheMock();
    const config = createConfigMock();
    const shortCodeGenerator = createShortCodeGeneratorMock();
    config.getOrThrow.mockReturnValue({ shortLinkBaseUrl: 'https://sho.rt' });

    return {
      prisma,
      redirectCache,
      config,
      shortCodeGenerator,
      service: new LinksService(
        prisma,
        redirectCache,
        config,
        shortCodeGenerator,
      ),
    };
  };

  it('creates a generated short link and caches its redirect payload', async () => {
    const { service, prisma, redirectCache, shortCodeGenerator } =
      createService();
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    shortCodeGenerator.next.mockResolvedValue('abc123');
    prisma.link.create.mockResolvedValue({
      id: 'link-id',
      userId: 'user-id',
      shortCode: 'abc123',
      originalUrl: 'https://example.com',
      isActive: true,
      expiresAt: null,
      createdAt,
      updatedAt: createdAt,
    });

    await expect(
      service.create('user-id', 'https://example.com'),
    ).resolves.toEqual({
      id: 'link-id',
      userId: 'user-id',
      shortCode: 'abc123',
      originalUrl: 'https://example.com',
      isActive: true,
      expiresAt: null,
      createdAt,
      updatedAt: createdAt,
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
    expect(redirectCache.set).toHaveBeenCalledWith('abc123', {
      originalUrl: 'https://example.com',
      isActive: true,
      expiresAt: null,
    });
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
    const { service, prisma, redirectCache } = createService();
    redirectCache.get.mockResolvedValue({
      originalUrl: 'https://example.com',
      isActive: true,
      expiresAt: null,
    });

    await expect(service.resolveRedirect('abc123')).resolves.toBe(
      'https://example.com',
    );

    expect(prisma.link.findUnique).not.toHaveBeenCalled();
  });

  it('rejects inactive or expired redirects', async () => {
    const { service, redirectCache } = createService();
    redirectCache.get.mockResolvedValue({
      originalUrl: 'https://example.com',
      isActive: false,
      expiresAt: null,
    });

    await expect(service.resolveRedirect('abc123')).rejects.toBeInstanceOf(
      GoneException,
    );

    redirectCache.get.mockResolvedValue({
      originalUrl: 'https://example.com',
      isActive: true,
      expiresAt: '2020-01-01T00:00:00.000Z',
    });

    await expect(service.resolveRedirect('abc123')).rejects.toBeInstanceOf(
      GoneException,
    );
  });

  it('deactivates an active link and clears its redirect cache on delete', async () => {
    const { service, prisma, redirectCache } = createService();
    const now = new Date();
    prisma.link.findFirst.mockResolvedValue({
      id: 'link-id',
      userId: 'user-id',
      shortCode: 'abc123',
      originalUrl: 'https://example.com',
      isActive: true,
      expiresAt: null,
      createdAt: now,
      updatedAt: now,
    });

    await expect(service.delete('user-id', 'link-id')).resolves.toBeUndefined();

    expect(prisma.link.update).toHaveBeenCalledWith({
      where: { id: 'link-id' },
      data: { isActive: false },
    });
    expect(redirectCache.del).toHaveBeenCalledWith('abc123');
  });
});

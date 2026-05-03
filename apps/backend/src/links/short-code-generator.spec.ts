/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/unbound-method */
import { ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { mock, mockDeep } from 'vitest-mock-extended';
import { ShortCodeGenerator } from './short-code-generator.js';

interface RedisMock {
  exists(key: string): Promise<boolean>;
  setNx(key: string, value: string): Promise<boolean>;
  incr(key: string): Promise<number>;
}

interface PrismaMock {
  link: {
    count(): Promise<number>;
  };
}

describe('ShortCodeGenerator', () => {
  const createGenerator = () => {
    const redis = mock<RedisMock>();
    const prisma = mockDeep<PrismaMock>();

    return {
      redis,
      prisma,
      generator: new ShortCodeGenerator(redis as any, prisma as any),
    };
  };

  it('initializes the counter before returning the first generated code', async () => {
    const { generator, redis, prisma } = createGenerator();
    redis.exists.mockResolvedValue(false);
    prisma.link.count.mockResolvedValue(0);
    redis.setNx.mockResolvedValue(true);
    redis.incr.mockResolvedValue(62 ** 5);

    await expect(generator.next()).resolves.toBe('baaaaa');

    expect(prisma.link.count).toHaveBeenCalledTimes(1);
    expect(redis.setNx).toHaveBeenCalledWith(
      'links:counter',
      String(62 ** 5 - 1),
    );
    expect(redis.incr).toHaveBeenCalledWith('links:counter');
  });

  it('refuses to initialize when links already exist', async () => {
    const { generator, redis, prisma } = createGenerator();
    redis.exists.mockResolvedValue(false);
    prisma.link.count.mockResolvedValue(1);

    await expect(generator.next()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );

    expect(redis.setNx).not.toHaveBeenCalled();
    expect(redis.incr).not.toHaveBeenCalled();
  });

  it('wraps Redis failures as service unavailable', async () => {
    const { generator, redis } = createGenerator();
    redis.exists.mockResolvedValue(true);
    redis.incr.mockRejectedValue(new Error('redis down'));

    await expect(generator.next()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});

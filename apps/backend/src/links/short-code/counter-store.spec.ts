import { describe, expect, it } from 'vitest';
import {
  createPrismaMock,
  createRedisMock,
} from '../../common/test-utils/mocks.js';
import { RedisCounterStore } from './counter-store.js';

describe('RedisCounterStore', () => {
  // Helper function to create a store instance with mocked dependencies
  const createStore = () => {
    const redis = createRedisMock();
    const prisma = createPrismaMock();
    return {
      redis,
      prisma,
      store: new RedisCounterStore(redis, prisma),
    };
  };

  describe('onModuleInit', () => {
    it('seeds the counter when neither counter nor links exist', async () => {
      const { store, redis, prisma } = createStore();
      redis.exists.mockResolvedValue(false);
      prisma.link.count.mockResolvedValue(0);
      redis.setNx.mockResolvedValue(true);

      await store.onModuleInit();

      expect(redis.setNx).toHaveBeenCalledWith(
        'links:counter',
        String(62 ** 5 - 1),
      );
    });
  });

  describe('next', () => {
    it('increments and returns the counter value', async () => {
      const { store, redis } = createStore();
      redis.incr.mockResolvedValue(62 ** 5);

      await expect(store.next()).resolves.toBe(62 ** 5);
      expect(redis.incr).toHaveBeenCalledWith('links:counter');
    });
  });
});

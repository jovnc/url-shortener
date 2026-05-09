import { mock, mockDeep } from 'vitest-mock-extended';
import type { PrismaService } from '../database/prisma.service.js';
import type { RedisService } from '../redis/redis.service.js';

export const createPrismaMock = () => mockDeep<PrismaService>();
export const createRedisMock = () => mock<RedisService>();

export type PrismaMock = ReturnType<typeof createPrismaMock>;
export type RedisMock = ReturnType<typeof createRedisMock>;

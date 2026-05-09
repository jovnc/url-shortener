import { mock, mockDeep } from 'vitest-mock-extended';
import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../database/prisma.service.js';
import type { RedisService } from '../redis/redis.service.js';

export const createPrismaMock = () => mockDeep<PrismaService>();
export const createRedisMock = () => mock<RedisService>();
export const createConfigMock = () => mock<ConfigService>();

export type PrismaMock = ReturnType<typeof createPrismaMock>;
export type RedisMock = ReturnType<typeof createRedisMock>;
export type ConfigMock = ReturnType<typeof createConfigMock>;

import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service.js';
import { RedisService } from '../../common/redis/redis.service.js';

const CACHE_COUNTER_KEY = 'links:counter';
const COUNTER_SEED = 62 ** 5 - 1;

export abstract class CounterStore {
  abstract next(): Promise<number>;
}

@Injectable()
export class RedisCounterStore extends CounterStore implements OnModuleInit {
  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async onModuleInit() {
    // Seed counter on startup
    // Limitation: accept rare failure where redis loses counter value, but random short codes already exist in postgres
    // Can be mitigated with Redis AOF persistence / store counter in postgres
    await this.redis.setNx(CACHE_COUNTER_KEY, String(COUNTER_SEED));
  }

  async next(): Promise<number> {
    return this.redis.incr(CACHE_COUNTER_KEY);
  }
}

import {
  Injectable,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service.js';
import { RedisService } from '../../common/redis/redis.service.js';

const COUNTER_KEY = 'links:counter';
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
    const exists = await this.redis.exists(COUNTER_KEY);
    if (!exists) {
      const linkCount = await this.prisma.link.count();
      if (linkCount > 0) {
        throw new ServiceUnavailableException(
          'Short-code counter is not initialized',
        );
      }
      await this.redis.setNx(COUNTER_KEY, String(COUNTER_SEED));
    }
  }

  async next(): Promise<number> {
    return this.redis.incr(COUNTER_KEY);
  }
}

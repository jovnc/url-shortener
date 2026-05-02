import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';

const BASE62_ALPHABET =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const COUNTER_KEY = 'links:counter';

@Injectable()
export class ShortCodeGenerator {
  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async next(): Promise<string> {
    try {
      const exists = await this.redis.exists(COUNTER_KEY);
      if (!exists) {
        const linkCount = await this.prisma.link.count();
        if (linkCount > 0) {
          throw new ServiceUnavailableException(
            'Short-code counter is not initialized',
          );
        }
        await this.redis.setNx(COUNTER_KEY, '0');
      }

      const counter = await this.redis.incr(COUNTER_KEY);
      return this.encode(counter);
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException(
        'Short-code counter is unavailable',
      );
    }
  }

  private encode(value: number): string {
    if (value === 0) return BASE62_ALPHABET[0];

    let remaining = value;
    let encoded = '';
    while (remaining > 0) {
      encoded = BASE62_ALPHABET[remaining % 62] + encoded;
      remaining = Math.floor(remaining / 62);
    }
    return encoded;
  }
}

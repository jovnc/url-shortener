import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service.js';
import { RedisService } from '../common/redis/redis.service.js';

const BASE62_ALPHABET =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const COUNTER_KEY = 'links:counter';
const MIN_CODE_LENGTH = 6;
// 62^5 - 1: first INCR yields 62^5, which encodes naturally to 6 chars
const COUNTER_SEED = 62 ** 5 - 1;

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
        await this.redis.setNx(COUNTER_KEY, String(COUNTER_SEED));
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
    if (value === 0) return BASE62_ALPHABET[0].repeat(MIN_CODE_LENGTH);

    let remaining = value;
    let encoded = '';
    while (remaining > 0) {
      encoded = BASE62_ALPHABET[remaining % 62] + encoded;
      remaining = Math.floor(remaining / 62);
    }

    while (encoded.length < MIN_CODE_LENGTH) {
      encoded = BASE62_ALPHABET[0] + encoded;
    }
    return encoded;
  }
}

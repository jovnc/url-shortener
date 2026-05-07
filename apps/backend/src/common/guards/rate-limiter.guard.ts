import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { RedisService } from '../redis/redis.service.js';

const LIMIT = 100;
const WINDOW_SECONDS = 60;

/**
 * A simple rate limiter guard that limits requests based on the client's IP address.
 * Uses fixed window counter algorithm with Redis.
 * Alternatives: sliding window, token bucket, leaky bucket, etc.
 * For more advanced use cases, can also use `@nestjs/throttler`
 */
@Injectable()
export class RateLimiterGuard implements CanActivate {
  constructor(private readonly redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const ip = req.ips.length ? req.ips[0] : req.ip;
    const key = `limit:${ip}`;

    const hits = await this.redis.incr(key);
    if (hits === 1) {
      await this.redis.expire(key, WINDOW_SECONDS);
    }

    res.setHeader('X-RateLimit-Limit', LIMIT);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, LIMIT - hits));

    if (hits > LIMIT) {
      res.setHeader('Retry-After', WINDOW_SECONDS);
      throw new HttpException(
        'Too Many Requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}

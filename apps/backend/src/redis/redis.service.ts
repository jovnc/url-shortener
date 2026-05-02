import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type RedisClientType } from 'redis';
import type { AppConfig } from '../app.config.js';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: RedisClientType;

  constructor(configService: ConfigService) {
    this.client = createClient({
      url: configService.getOrThrow<AppConfig>('app').redisUrl,
    });
    this.client.on('error', (error) => {
      this.logger.warn(error instanceof Error ? error.message : String(error));
    });
  }

  async onModuleInit() {
    await this.client.connect();
    await this.client.ping();
  }

  async onModuleDestroy() {
    if (this.client.isOpen) await this.client.quit();
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds !== undefined) {
        await this.client.set(key, value, { EX: ttlSeconds });
      } else {
        await this.client.set(key, value);
      }
    } catch {
      // cache write failure is acceptable
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch {
      // ignore
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return (await this.client.exists(key)) > 0;
    } catch {
      return false;
    }
  }

  async setNx(key: string, value: string): Promise<boolean> {
    try {
      return (await this.client.set(key, value, { NX: true })) !== null;
    } catch {
      return false;
    }
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }
}

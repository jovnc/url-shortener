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

  getClient() {
    return this.client;
  }
}

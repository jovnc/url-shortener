import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../prisma/generated/client.js';
import type { AppConfig } from '../app.config.js';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(configService: ConfigService) {
    const config = configService.get<AppConfig>('app');
    if (!config || !config.databaseUrl) {
      throw new Error('Database URL is not configured');
    }
    const adapter = new PrismaPg({
      connectionString: config.databaseUrl,
    });
    super({ adapter });
  }
}

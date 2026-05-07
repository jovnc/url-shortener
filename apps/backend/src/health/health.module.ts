import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { DatabaseModule } from '../common/database/database.module.js';
import { RedisModule } from '../common/redis/redis.module.js';

@Module({
  imports: [DatabaseModule, RedisModule],
  controllers: [HealthController],
})
export class HealthModule {}

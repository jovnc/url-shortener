import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RedisModule } from '../redis/redis.module.js';
import { LinksController } from './links.controller.js';
import { LinksService } from './links.service.js';
import { ShortCodeGenerator } from './short-code-generator.js';

@Module({
  imports: [AuthModule, RedisModule],
  controllers: [LinksController],
  providers: [LinksService, ShortCodeGenerator],
})
export class LinksModule {}

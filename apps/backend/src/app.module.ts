import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './auth/auth.module.js';
import { appConfig } from './app.config.js';
import { LinksModule } from './links/links.module.js';
import { RedisModule } from './redis/redis.module.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    DatabaseModule,
    RedisModule,
    AuthModule,
    LinksModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

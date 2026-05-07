import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './common/database/database.module.js';
import { AuthModule } from './auth/auth.module.js';
import { appConfig } from './app.config.js';
import { LinksModule } from './links/links.module.js';
import { RedisModule } from './common/redis/redis.module.js';
import { RateLimiterGuard } from './common/guards/rate-limiter.guard.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    DatabaseModule,
    RedisModule,
    AuthModule,
    LinksModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimiterGuard,
    },
  ],
})
export class AppModule {}

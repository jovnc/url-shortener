import { Module } from '@nestjs/common';
import { SessionModule } from '../auth/session/session.module.js';
import { RedisModule } from '../common/redis/redis.module.js';
import { LinksController } from './links.controller.js';
import { LinksService } from './links.service.js';
import { ShortCodeGenerator } from './short-code/short-code-generator.js';
import { CounterStore, RedisCounterStore } from './short-code/counter-store.js';
import { RedirectCache } from './redirect-cache/redirect-cache.js';
import { RedisRedirectCache } from './redirect-cache/redis-redirect-cache.js';

@Module({
  imports: [SessionModule, RedisModule],
  controllers: [LinksController],
  providers: [
    LinksService,
    ShortCodeGenerator,
    {
      provide: CounterStore,
      useClass: RedisCounterStore,
    },
    {
      provide: RedirectCache,
      useClass: RedisRedirectCache,
    },
  ],
})
export class LinksModule {}

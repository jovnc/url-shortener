import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { AppConfig } from '../../app.config.js';
import { SessionService } from './session.service.js';
import { JwtGuard } from './jwt.guard.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<AppConfig>('app').jwtSecret,
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [SessionService, JwtGuard],
  exports: [SessionService, JwtGuard, JwtModule],
})
export class SessionModule {}

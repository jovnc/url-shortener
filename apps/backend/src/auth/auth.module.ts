import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwksController } from './jwks.controller.js';
import { JwtGuard } from './jwt.guard.js';
import type { AppConfig } from '../app.config.js';

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
  providers: [AuthService, JwtGuard],
  controllers: [AuthController, JwksController],
  exports: [JwtGuard, JwtModule],
})
export class AuthModule {}

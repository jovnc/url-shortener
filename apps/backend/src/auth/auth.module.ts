import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { OidcModule } from './oidc/oidc.module.js';
import { SessionModule } from './session/session.module.js';

@Module({
  imports: [OidcModule, SessionModule],
  controllers: [AuthController],
  exports: [SessionModule],
})
export class AuthModule {}

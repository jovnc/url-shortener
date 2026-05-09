import { Module } from '@nestjs/common';
import { OidcService } from './oidc.service.js';
import { JwksController } from './jwks.controller.js';

@Module({
  providers: [OidcService],
  controllers: [JwksController],
  exports: [OidcService],
})
export class OidcModule {}

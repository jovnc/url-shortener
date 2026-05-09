import { Controller, Get } from '@nestjs/common';
import { OidcService } from './oidc.service.js';

@Controller('.well-known')
export class JwksController {
  constructor(private readonly oidcService: OidcService) {}

  @Get('jwks.json')
  getJwks() {
    return this.oidcService.getPublicJwks();
  }
}

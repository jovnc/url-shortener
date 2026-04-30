import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service.js';

@Controller('.well-known')
export class JwksController {
  constructor(private readonly authService: AuthService) {}

  @Get('jwks.json')
  getJwks() {
    return this.authService.getPublicJwks();
  }
}

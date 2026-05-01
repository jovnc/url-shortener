import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { JwtGuard } from './jwt.guard.js';
import type { AppConfig } from '../app.config.js';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    singpassSub: string;
  };
}

const OIDC_COOKIES = [
  'oidc_state',
  'oidc_nonce',
  'oidc_verifier',
  'oidc_dpop',
] as const;

const OIDC_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  maxAge: 300_000,
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('login')
  async login(@Res() res: Response) {
    // Use PAR for Mockpass FAPI 2.0 auth flow
    const { url, state, nonce, codeVerifier, dpopKeys } =
      await this.authService.buildLoginUrl();

    res.cookie('oidc_state', state, OIDC_COOKIE_OPTS);
    res.cookie('oidc_nonce', nonce, OIDC_COOKIE_OPTS);
    res.cookie('oidc_verifier', codeVerifier, OIDC_COOKIE_OPTS);
    res.cookie('oidc_dpop', JSON.stringify(dpopKeys), OIDC_COOKIE_OPTS);

    res.redirect(url);
  }

  @Get('callback')
  async callback(@Req() req: Request, @Res() res: Response) {
    const cookies = req.cookies as Record<string, string>;
    const expectedState = cookies['oidc_state'];
    const expectedNonce = cookies['oidc_nonce'];
    const codeVerifier = cookies['oidc_verifier'];

    let dpopKeys: {
      privateJwk: object;
      publicJwk: object;
    };
    try {
      dpopKeys = JSON.parse(cookies['oidc_dpop']);
    } catch {
      throw new BadRequestException('Invalid OIDC session');
    }

    const redirectBase = new URL(
      this.configService.getOrThrow<AppConfig>('app').mockpass.redirectUri,
    );
    redirectBase.search = new URLSearchParams(
      req.query as Record<string, string>,
    ).toString();

    const { sessionToken } = await this.authService.handleCallback(
      redirectBase.toString(),
      codeVerifier,
      expectedState,
      expectedNonce,
      dpopKeys,
    );

    OIDC_COOKIES.forEach((name) => res.clearCookie(name));
    res.cookie('session', sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 86_400_000,
    });
    res.redirect(this.configService.getOrThrow<AppConfig>('app').frontendUrl);
  }

  @Post('logout')
  logout(@Res() res: Response) {
    res.clearCookie('session');
    res.sendStatus(200);
  }

  @Get('me')
  @UseGuards(JwtGuard)
  async me(@Req() req: AuthenticatedRequest) {
    return this.authService.findUserById(req.user.sub);
  }
}

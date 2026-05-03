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
import type { CookieOptions, Request, Response } from 'express';
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

const COOKIE_PATHS = ['/', '/api/v1/auth'] as const;
const OIDC_COOKIE_MAX_AGE = 300_000;
const SESSION_COOKIE_MAX_AGE = 86_400_000;

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

    this.clearAuthCookies(res);

    const cookieOptions = this.authCookieOptions(OIDC_COOKIE_MAX_AGE);
    res.cookie('oidc_state', state, cookieOptions);
    res.cookie('oidc_nonce', nonce, cookieOptions);
    res.cookie('oidc_verifier', codeVerifier, cookieOptions);
    res.cookie('oidc_dpop', JSON.stringify(dpopKeys), cookieOptions);

    res.redirect(url);
  }

  @Get('callback')
  async callback(@Req() req: Request, @Res() res: Response) {
    const cookies = req.cookies;
    const expectedState = String(cookies['oidc_state'] ?? '');
    const expectedNonce = String(cookies['oidc_nonce'] ?? '');
    const codeVerifier = String(cookies['oidc_verifier'] ?? '');

    let dpopKeys: {
      privateJwk: object;
      publicJwk: object;
    };
    try {
      dpopKeys = JSON.parse(
        String(cookies['oidc_dpop'] ?? ''),
      ) as typeof dpopKeys;
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

    this.clearAuthCookies(res);
    res.cookie(
      'session',
      sessionToken,
      this.authCookieOptions(SESSION_COOKIE_MAX_AGE),
    );
    const dashboardUrl = new URL(
      '/dashboard',
      this.configService.getOrThrow<AppConfig>('app').frontendUrl,
    );
    res.redirect(dashboardUrl.toString());
  }

  @Post('logout')
  logout(@Res() res: Response) {
    COOKIE_PATHS.forEach((path) => res.clearCookie('session', { path }));
    res.sendStatus(200);
  }

  @Get('me')
  @UseGuards(JwtGuard)
  async me(@Req() req: AuthenticatedRequest) {
    return this.authService.findUserById(req.user.sub);
  }

  private authCookieOptions(maxAge: number): CookieOptions {
    const { frontendUrl } = this.configService.getOrThrow<AppConfig>('app');
    const secure = new URL(frontendUrl).protocol === 'https:';

    return {
      httpOnly: true,
      sameSite: secure ? 'none' : 'lax',
      secure,
      path: '/',
      maxAge,
    };
  }

  private clearAuthCookies(res: Response) {
    OIDC_COOKIES.forEach((name) =>
      COOKIE_PATHS.forEach((path) => res.clearCookie(name, { path })),
    );
    COOKIE_PATHS.forEach((path) => res.clearCookie('session', { path }));
  }
}

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
import { OidcService } from './oidc/oidc.service.js';
import { SessionService } from './session/session.service.js';
import { JwtGuard, type SessionPayload } from './session/jwt.guard.js';
import { CsrfService } from '../common/csrf/csrf.service.js';
import type { AppConfig } from '../app.config.js';

type AuthenticatedRequest = Request & { user: SessionPayload };

const OIDC_COOKIES = [
  'oidc_state',
  'oidc_nonce',
  'oidc_verifier',
  'oidc_dpop',
] as const;

const COOKIE_PATHS = ['/', '/api/v1/auth'] as const;
const OIDC_COOKIE_MAX_AGE = 300_000; // 5 minutes
const SESSION_COOKIE_MAX_AGE = 86_400_000; // 24 hours

@Controller('auth')
export class AuthController {
  constructor(
    private readonly oidcService: OidcService,
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
    private readonly csrfService: CsrfService,
  ) {}

  @Get('login')
  async login(@Res() res: Response) {
    const { url, state, nonce, codeVerifier, dpopKeys } =
      await this.oidcService.buildLoginUrl();

    this.clearAuthCookies(res);

    // Store OIDC session data in cookies (HttpOnly, Secure, SameSite, Short expiry)
    // TODO: Consider using a server-side session store (eg. Redis) instead for better security
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

    const claim = await this.oidcService.handleCallback(
      redirectBase.toString(),
      codeVerifier,
      expectedState,
      expectedNonce,
      dpopKeys,
    );

    const { sessionToken } = await this.sessionService.createSession(claim);

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
  @UseGuards(JwtGuard)
  async logout(@Req() req: Request, @Res() res: Response) {
    await this.sessionService.blacklistToken(req.cookies.session as string);
    const { frontendUrl } = this.configService.getOrThrow<AppConfig>('app');
    const secure = new URL(frontendUrl).protocol === 'https:';
    const base = {
      httpOnly: true,
      secure,
      sameSite: secure ? 'none' : 'lax',
    } as const;
    COOKIE_PATHS.forEach((path) =>
      res.clearCookie('session', { ...base, path }),
    );
    res.clearCookie(this.csrfCookieName(secure), { ...base, path: '/' });
    res.sendStatus(200);
  }

  @Get('me')
  @UseGuards(JwtGuard)
  async me(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.sessionService.findUserById(req.user.sub);
    return { ...user, csrfToken: this.csrfService.generateToken(req, res) };
  }

  private authCookieOptions(maxAge: number): CookieOptions {
    const { frontendUrl } = this.configService.getOrThrow<AppConfig>('app');
    const secure = new URL(frontendUrl).protocol === 'https:';
    return {
      httpOnly: true,
      secure,
      sameSite: secure ? 'none' : 'lax',
      path: '/',
      maxAge,
    };
  }

  private clearAuthCookies(res: Response) {
    const { frontendUrl } = this.configService.getOrThrow<AppConfig>('app');
    const secure = new URL(frontendUrl).protocol === 'https:';
    const base = {
      httpOnly: true,
      secure,
      sameSite: secure ? 'none' : 'lax',
    } as const;
    OIDC_COOKIES.forEach((name) =>
      COOKIE_PATHS.forEach((path) => res.clearCookie(name, { ...base, path })),
    );
    COOKIE_PATHS.forEach((path) =>
      res.clearCookie('session', { ...base, path }),
    );
    res.clearCookie(this.csrfCookieName(secure), { ...base, path: '/' });
  }

  private csrfCookieName(secure: boolean) {
    return secure ? '__Host-psifi.x-csrf-token' : 'psifi.x-csrf-token';
  }
}

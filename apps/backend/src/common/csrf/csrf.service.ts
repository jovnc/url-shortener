import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { doubleCsrf } from 'csrf-csrf';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { AppConfig } from '../../app.config.js';

@Injectable()
export class CsrfService {
  readonly middleware: RequestHandler;
  private readonly _generateToken: (req: Request, res: Response) => string;

  constructor(configService: ConfigService) {
    const { csrfSecret, frontendUrl } =
      configService.getOrThrow<AppConfig>('app');
    const secure = new URL(frontendUrl).protocol === 'https:';

    const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
      getSecret: () => csrfSecret,
      getSessionIdentifier: (req) =>
        (req.cookies?.session as string | undefined) ?? '',
      cookieName: secure ? '__Host-psifi.x-csrf-token' : 'psifi.x-csrf-token',
      cookieOptions: {
        httpOnly: true,
        sameSite: secure ? 'none' : 'lax',
        secure,
        path: '/',
      },
    });

    // Convert the http-errors HttpError into a NestJS ForbiddenException so
    // AllExceptionsFilter returns 403 instead of 500.
    this.middleware = (req: Request, res: Response, next: NextFunction) => {
      doubleCsrfProtection(req, res, (err?: unknown) => {
        next(err ? new ForbiddenException('CSRF token mismatch') : undefined);
      });
    };

    this._generateToken = generateCsrfToken;
  }

  generateToken(req: Request, res: Response): string {
    return this._generateToken(req, res);
  }
}

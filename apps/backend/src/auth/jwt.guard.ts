import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

interface SessionPayload {
  sub: string;
  singpassSub: string;
}

interface SessionRequest extends Omit<Request, 'cookies'> {
  cookies: Record<string, unknown>;
  user?: SessionPayload;
}

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<SessionRequest>();
    const token = req.cookies?.['session'];
    if (typeof token !== 'string') throw new UnauthorizedException();
    try {
      req.user = this.jwtService.verify<SessionPayload>(token);
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}

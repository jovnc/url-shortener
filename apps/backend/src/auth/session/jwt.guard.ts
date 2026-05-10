import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export interface SessionPayload {
  sub: string;
  singpassSub: string;
}

interface SessionRequest extends Request {
  user?: SessionPayload;
}

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<SessionRequest>();
    const token = req.cookies?.session as string | undefined;
    if (typeof token !== 'string') throw new UnauthorizedException();
    try {
      req.user = this.jwtService.verify<SessionPayload>(token);
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}

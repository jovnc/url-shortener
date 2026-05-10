import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { RedisService } from '../../common/redis/redis.service.js';
import { BLOCKLIST_JTI_PREFIX } from './session.service.js';

export interface SessionPayload {
  sub: string;
  singpassSub: string;
  jti: string;
}

interface SessionRequest extends Request {
  user?: SessionPayload;
}

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<SessionRequest>();
    const token = req.cookies?.session as string | undefined;
    if (typeof token !== 'string') throw new UnauthorizedException();
    let payload: SessionPayload;
    try {
      payload = this.jwtService.verify<SessionPayload>(token);
    } catch {
      throw new UnauthorizedException();
    }
    if (await this.redis.exists(`${BLOCKLIST_JTI_PREFIX}${payload.jti}`)) {
      throw new UnauthorizedException();
    }
    req.user = payload;
    return true;
  }
}

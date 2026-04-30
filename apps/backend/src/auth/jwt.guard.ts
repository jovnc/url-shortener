import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = (req.cookies as Record<string, string>)?.['session'];
    if (!token) throw new UnauthorizedException();
    try {
      (req as Request & { user: unknown }).user = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}

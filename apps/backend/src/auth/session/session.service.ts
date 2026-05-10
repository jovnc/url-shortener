import { Injectable } from '@nestjs/common';

export const BLOCKLIST_JTI_PREFIX = 'blocklist:jti:';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../common/database/prisma.service.js';
import { RedisService } from '../../common/redis/redis.service.js';
import type { IdentityClaim } from '../oidc/oidc.service.js';

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redis: RedisService,
  ) {}

  async createSession(claim: IdentityClaim) {
    const user = await this.prisma.user.upsert({
      where: { sub: claim.sub },
      update: { name: claim.name },
      create: { sub: claim.sub, name: claim.name },
    });

    const sessionToken = await this.jwtService.signAsync({
      sub: user.id,
      singpassSub: claim.sub,
      jti: randomUUID(),
    });

    return { user, sessionToken };
  }

  async blacklistToken(token: string): Promise<void> {
    const payload = this.jwtService.decode<{
      jti?: string;
      exp?: number;
    }>(token);
    if (!payload?.jti) return;
    const ttl = payload.exp ? payload.exp - Math.floor(Date.now() / 1000) : 0;
    if (ttl > 0) {
      await this.redis.set(`${BLOCKLIST_JTI_PREFIX}${payload.jti}`, '1', ttl);
    }
  }

  findUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}

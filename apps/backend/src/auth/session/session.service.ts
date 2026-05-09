import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/database/prisma.service.js';
import type { IdentityClaim } from '../oidc/oidc.service.js';

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
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
    });

    return { user, sessionToken };
  }

  findUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}

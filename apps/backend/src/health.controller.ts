import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from './database/prisma.service.js';
import { RedisService } from './redis/redis.service.js';

enum ServiceStatus {
  OK = 'ok',
  ERROR = 'error',
}

enum HealthStatus {
  OK = 'ok',
  DEGRADED = 'degraded',
}

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  async check() {
    const [databaseStatus, redisStatus] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const overallStatus =
      databaseStatus === ServiceStatus.OK && redisStatus === ServiceStatus.OK
        ? HealthStatus.OK
        : HealthStatus.DEGRADED;

    const result = {
      status: overallStatus,
      services: { database: databaseStatus, redis: redisStatus },
    };

    if (overallStatus !== HealthStatus.OK) {
      throw new HttpException(result, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return result;
  }

  private async checkDatabase(): Promise<ServiceStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return ServiceStatus.OK;
    } catch {
      return ServiceStatus.ERROR;
    }
  }

  private async checkRedis(): Promise<ServiceStatus> {
    try {
      await this.redis.ping();
      return ServiceStatus.OK;
    } catch {
      return ServiceStatus.ERROR;
    }
  }
}

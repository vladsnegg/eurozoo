import { Controller, Get, Inject } from '@nestjs/common';
import type { HealthDto } from '@eurozoo/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { env } from '../../config/env';

@Controller('health')
export class HealthController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<HealthDto> {
    let database: 'up' | 'down' = 'up';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      process.stderr.write(
        `[health] database check failed: ${error instanceof Error ? error.message : String(error)}\n`,
      );
      database = 'down';
    }

    return {
      status: database === 'up' ? 'ok' : 'degraded',
      database,
      version: env.APP_VERSION,
      uptimeSeconds: Math.round(process.uptime()),
    };
  }
}

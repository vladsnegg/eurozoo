import { Inject, Injectable } from '@nestjs/common';
import type { EntityType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SourcesRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async forEntity(entityType: EntityType, entityId: string) {
    return this.prisma.entitySource.findMany({
      where: { entityType, entityId },
      include: { source: true },
      orderBy: [{ verifiedAt: 'desc' }, { retrievedAt: 'desc' }],
    });
  }

  async listPublic(skip: number, take: number, type?: string, reliability?: string) {
    const where = {
      ...(type ? { type: type as never } : {}),
      ...(reliability ? { reliability: reliability as never } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.source.findMany({ where, orderBy: { title: 'asc' }, skip, take }),
      this.prisma.source.count({ where }),
    ]);
    return { rows, total };
  }
}

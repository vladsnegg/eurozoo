import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NewsRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(params: { zooSlug?: string; skip: number; take: number }) {
    const where: Prisma.ZooNewsWhereInput = {
      publishStatus: 'published',
      ...(params.zooSlug ? { zoo: { slug: params.zooSlug } } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.zooNews.findMany({
        where,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: params.skip,
        take: params.take,
        include: {
          zoo: {
            include: {
              city: { include: { country: true } },
            },
          },
        },
      }),
      this.prisma.zooNews.count({ where }),
    ]);

    return { rows, total };
  }
}

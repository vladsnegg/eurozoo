import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type ResearchFilters = {
  status?: string;
  yearFrom?: number;
  yearTo?: number;
  country?: string;
  skip: number;
  take: number;
};

@Injectable()
export class ResearchRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(filters: ResearchFilters) {
    const where: Prisma.ResearchProjectWhereInput = {
      publishStatus: 'published',
      status: filters.status ? (filters.status as never) : undefined,
      startedYear: filters.yearFrom !== undefined ? { gte: filters.yearFrom } : undefined,
      endedYear: filters.yearTo !== undefined ? { lte: filters.yearTo } : undefined,
      zoos: filters.country
        ? { some: { zoo: { city: { country: { slug: filters.country } } } } }
        : undefined,
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.researchProject.findMany({
        where,
        include: {
          leadOrganization: true,
          _count: { select: { zoos: true, species: true } },
        },
        orderBy: { title: 'asc' },
        skip: filters.skip,
        take: filters.take,
      }),
      this.prisma.researchProject.count({ where }),
    ]);
    return { rows, total };
  }

  async detail(slug: string) {
    return this.prisma.researchProject.findFirst({
      where: { slug, publishStatus: 'published' },
      include: {
        leadOrganization: true,
        zoos: { include: { zoo: true } },
        species: { include: { taxon: true } },
      },
    });
  }
}

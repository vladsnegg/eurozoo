import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type ProgramFilters = {
  code?: string;
  status?: string;
  organization?: string;
  country?: string;
  skip: number;
  take: number;
  order: 'asc' | 'desc';
};

@Injectable()
export class ConservationRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async programs(filters: ProgramFilters) {
    const where: Prisma.ConservationProgramWhereInput = {
      publishStatus: 'published',
      code: filters.code ? (filters.code as never) : undefined,
      status: filters.status ? (filters.status as never) : undefined,
      organization: {
        slug: filters.organization,
        country: filters.country ? { slug: filters.country } : undefined,
      },
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.conservationProgram.findMany({
        where,
        include: {
          organization: true,
          _count: { select: { species: true, zoos: true } },
        },
        orderBy: { name: filters.order },
        skip: filters.skip,
        take: filters.take,
      }),
      this.prisma.conservationProgram.count({ where }),
    ]);
    return { rows, total };
  }

  async program(slug: string) {
    return this.prisma.conservationProgram.findFirst({
      where: { slug, publishStatus: 'published' },
      include: {
        organization: true,
        species: {
          include: { taxon: { include: { profile: { include: { iucnStatus: true } } } } },
        },
        zoos: {
          include: { zoo: { include: { city: { include: { country: true } } } } },
          orderBy: { sinceYear: 'asc' },
        },
      },
    });
  }

  async organizations(skip: number, take: number, type?: string, country?: string) {
    const where: Prisma.OrganizationWhereInput = {
      publishStatus: 'published',
      type: type ? (type as never) : undefined,
      country: country ? { slug: country } : undefined,
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.organization.findMany({
        where,
        include: {
          country: true,
          _count: { select: { zoos: true, programs: true } },
        },
        orderBy: { name: 'asc' },
        skip,
        take,
      }),
      this.prisma.organization.count({ where }),
    ]);
    return { rows, total };
  }

  async organization(slug: string) {
    return this.prisma.organization.findFirst({
      where: { slug, publishStatus: 'published' },
      include: {
        country: true,
        zoos: {
          include: { zoo: true },
          orderBy: { sinceYear: 'asc' },
        },
        programs: {
          where: { publishStatus: 'published' },
          orderBy: { name: 'asc' },
        },
        ledResearch: {
          where: { publishStatus: 'published' },
          orderBy: { title: 'asc' },
        },
      },
    });
  }
}

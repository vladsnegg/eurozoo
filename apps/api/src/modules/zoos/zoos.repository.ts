import { Inject, Injectable } from '@nestjs/common';
import { Prisma, type Zoo } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type ZooListFilters = {
  country?: string;
  city?: string;
  yearFrom?: number;
  yearTo?: number;
  hasPrograms?: boolean;
  hasThreatened?: boolean;
  hasCoords?: boolean;
  skip: number;
  take: number;
  orderBy: Prisma.ZooOrderByWithRelationInput;
};

export type ZooListRow = Prisma.ZooGetPayload<{
  include: {
    city: { include: { country: true } };
    _count: { select: { species: true; programs: true } };
  };
}>;

@Injectable()
export class ZoosRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  buildWhere(filters: ZooListFilters): Prisma.ZooWhereInput {
    return {
      publishStatus: 'published',
      foundedYear:
        filters.yearFrom !== undefined || filters.yearTo !== undefined
          ? { gte: filters.yearFrom, lte: filters.yearTo }
          : undefined,
      city: {
        slug: filters.city,
        country: filters.country ? { slug: filters.country } : undefined,
      },
      programs: filters.hasPrograms ? { some: {} } : undefined,
      species: filters.hasThreatened
        ? { some: { taxon: { profile: { iucnStatus: { severity: { gte: 3 } } } } } }
        : undefined,
      lat: filters.hasCoords ? { not: null } : undefined,
      lng: filters.hasCoords ? { not: null } : undefined,
    };
  }

  async list(filters: ZooListFilters): Promise<{ rows: ZooListRow[]; total: number }> {
    const where = this.buildWhere(filters);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.zoo.findMany({
        where,
        include: {
          city: { include: { country: true } },
          _count: { select: { species: true, programs: true } },
        },
        orderBy: filters.orderBy,
        skip: filters.skip,
        take: filters.take,
      }),
      this.prisma.zoo.count({ where }),
    ]);
    return { rows, total };
  }

  async threatenedZooIds(ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const rows = await this.prisma.$queryRaw<Array<{ zoo_id: string }>>`
      SELECT DISTINCT zs.zoo_id
      FROM zoo_species zs
      JOIN species_profile sp ON sp.taxon_id = zs.taxon_id
      JOIN iucn_status iu ON iu.id = sp.iucn_status_id
      WHERE zs.zoo_id = ANY(${ids}::uuid[]) AND iu.severity >= 3
    `;
    return new Set(rows.map((row) => row.zoo_id));
  }

  async findBySlug(slug: string): Promise<Zoo | null> {
    return this.prisma.zoo.findFirst({ where: { slug, publishStatus: 'published' } });
  }

  async detail(slug: string) {
    return this.prisma.zoo.findFirst({
      where: { slug, publishStatus: 'published' },
      include: {
        city: { include: { country: true } },
        species: {
          include: {
            taxon: { include: { profile: { include: { iucnStatus: true } } } },
          },
          orderBy: { taxon: { scientificName: 'asc' } },
        },
        programs: { include: { program: true } },
        organizations: { include: { organization: true } },
        research: { include: { research: true } },
        education: true,
        facilities: { include: { facility: true } },
        events: { orderBy: { year: 'asc' } },
        enclosures: true,
      },
    });
  }
}

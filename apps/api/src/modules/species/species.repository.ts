import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type SpeciesFilters = {
  iucn?: string;
  className?: string;
  family?: string;
  habitat?: string;
  country?: string;
  hasPrograms?: boolean;
  skip: number;
  take: number;
  orderBy: Prisma.TaxonOrderByWithRelationInput;
};

@Injectable()
export class SpeciesRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async descendantIds(slug: string): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      WITH RECURSIVE d AS (
        SELECT id FROM taxon WHERE slug = ${slug}
        UNION ALL
        SELECT t.id FROM taxon t JOIN d ON t.parent_id = d.id
      )
      SELECT id FROM d
    `;
    return rows.map((row) => row.id);
  }

  async list(filters: SpeciesFilters) {
    const scopeSlug = filters.family ?? filters.className;
    const scopeIds = scopeSlug ? await this.descendantIds(scopeSlug) : null;

    const where: Prisma.TaxonWhereInput = {
      publishStatus: 'published',
      rank: { code: 'species' },
      ...(scopeIds ? { id: { in: scopeIds } } : {}),
      profile: filters.iucn ? { iucnStatus: { code: filters.iucn } } : undefined,
      habitats: filters.habitat ? { some: { habitat: { slug: filters.habitat } } } : undefined,
      programs: filters.hasPrograms ? { some: {} } : undefined,
      zoos: filters.country ? { some: { zoo: { city: { country: { slug: filters.country } } } } } : undefined,
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.taxon.findMany({
        where,
        include: {
          rank: true,
          profile: { include: { iucnStatus: true } },
          _count: { select: { zoos: true, programs: true } },
        },
        orderBy: filters.orderBy,
        skip: filters.skip,
        take: filters.take,
      }),
      this.prisma.taxon.count({ where }),
    ]);

    return { rows, total };
  }

  async detail(slug: string) {
    return this.prisma.taxon.findFirst({
      where: { slug, publishStatus: 'published', rank: { code: 'species' } },
      include: {
        rank: true,
        profile: { include: { iucnStatus: true } },
        habitats: { include: { habitat: true } },
        zoos: {
          include: { zoo: { include: { city: { include: { country: true } } } } },
          orderBy: { zoo: { name: 'asc' } },
        },
        programs: { include: { program: { include: { _count: { select: { zoos: true } } } } } },
        research: { include: { research: true } },
      },
    });
  }

  async lineage(taxonId: string) {
    const rows = await this.prisma.$queryRaw<Array<{ taxon_id: string; depth: number }>>`
      SELECT taxon_id, depth FROM v_taxon_lineage WHERE start_id = ${taxonId}::uuid ORDER BY depth DESC
    `;
    if (rows.length === 0) return [];
    const ids = rows.map((row) => row.taxon_id);
    const nodes = await this.prisma.taxon.findMany({
      where: { id: { in: ids } },
      include: { rank: true, _count: { select: { children: true } } },
    });
    const byId = new Map(nodes.map((node) => [node.id, node]));
    return ids.map((id) => byId.get(id)).filter((node): node is (typeof nodes)[number] => Boolean(node));
  }

  async inferredProgramSpecies(taxonId: string) {
    return this.prisma.$queryRaw<
      Array<{ zoo_id: string; zoo_slug: string; zoo_name: string; program_id: string; program_slug: string; program_name: string }>
    >`
      SELECT DISTINCT z.id AS zoo_id, z.slug AS zoo_slug, z.name AS zoo_name,
             p.id AS program_id, p.slug AS program_slug, p.name AS program_name
      FROM v_zoo_program_species v
      JOIN zoo z ON z.id = v.zoo_id
      JOIN conservation_program p ON p.id = v.program_id
      WHERE v.taxon_id = ${taxonId}::uuid
      ORDER BY z.name
    `;
  }

  async children(taxonId: string, skip: number, take: number) {
    const where: Prisma.TaxonWhereInput = { parentId: taxonId, publishStatus: 'published' };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.taxon.findMany({
        where,
        include: { rank: true, _count: { select: { children: true } } },
        orderBy: { scientificName: 'asc' },
        skip,
        take,
      }),
      this.prisma.taxon.count({ where }),
    ]);
    return { rows, total };
  }

  async bySlug(slug: string) {
    return this.prisma.taxon.findFirst({
      where: { slug, publishStatus: 'published' },
      include: { rank: true, _count: { select: { children: true } } },
    });
  }

  async byRank(rankCode: string) {
    return this.prisma.taxon.findMany({
      where: { rank: { code: rankCode }, publishStatus: 'published' },
      include: { rank: true, _count: { select: { children: true } } },
      orderBy: { scientificName: 'asc' },
      take: 200,
    });
  }
}

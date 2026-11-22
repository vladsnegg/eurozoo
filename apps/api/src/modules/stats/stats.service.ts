import { Inject, Injectable } from '@nestjs/common';
import type { HighlightsDto, StatsDto } from '@eurozoo/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async stats(): Promise<StatsDto> {
    const [zoos, species, countries, programs, organizations, research, sources, edges] =
      await Promise.all([
        this.prisma.zoo.count({ where: { publishStatus: 'published' } }),
        this.prisma.taxon.count({ where: { publishStatus: 'published', rank: { code: 'species' } } }),
        this.prisma.country.count(),
        this.prisma.conservationProgram.count({ where: { publishStatus: 'published' } }),
        this.prisma.organization.count({ where: { publishStatus: 'published' } }),
        this.prisma.researchProject.count({ where: { publishStatus: 'published' } }),
        this.prisma.source.count(),
        this.prisma.knowledgeEdge.count(),
      ]);

    return { zoos, species, countries, programs, organizations, research, sources, edges };
  }

  async highlights(): Promise<HighlightsDto> {
    const speciesGroups = await this.prisma.zooSpecies.groupBy({
      by: ['taxonId'],
      where: { zoo: { publishStatus: 'published' } },
      _count: { taxonId: true },
      orderBy: { _count: { taxonId: 'desc' } },
      take: 5,
    });
    const taxa = await this.prisma.taxon.findMany({
      where: { id: { in: speciesGroups.map((group) => group.taxonId) } },
      select: { id: true, slug: true, scientificName: true, commonNameRu: true },
    });
    const taxonById = new Map(taxa.map((taxon) => [taxon.id, taxon]));

    const countryRows = await this.prisma.$queryRaw<
      Array<{ id: string; slug: string; name: string; zoo_count: number }>
    >`
      SELECT co.id, co.slug, co.name, count(z.id)::int AS zoo_count
      FROM country co
      JOIN city c ON c.country_id = co.id
      JOIN zoo z ON z.city_id = c.id AND z.publish_status = 'published'
      GROUP BY co.id, co.slug, co.name
      ORDER BY zoo_count DESC, co.name
      LIMIT 5
    `;

    const programs = await this.prisma.conservationProgram.findMany({
      where: { publishStatus: 'published' },
      include: { _count: { select: { zoos: true } } },
      orderBy: { zoos: { _count: 'desc' } },
      take: 5,
    });

    const recentZoos = await this.prisma.zoo.findMany({
      where: { publishStatus: 'published' },
      select: { id: true, slug: true, name: true, updatedAt: true, city: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 8,
    });

    return {
      topSpecies: speciesGroups.flatMap((group) => {
        const taxon = taxonById.get(group.taxonId);
        if (!taxon) return [];
        return [
          {
            id: taxon.id,
            slug: taxon.slug,
            title: taxon.commonNameRu ?? taxon.scientificName,
            zooCount: group._count.taxonId,
          },
        ];
      }),
      topCountries: countryRows.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.name,
        zooCount: row.zoo_count,
      })),
      topPrograms: programs.map((program) => ({
        id: program.id,
        slug: program.slug,
        title: program.name,
        zooCount: program._count.zoos,
      })),
      recent: recentZoos.map((zoo) => ({
        type: 'zoo' as const,
        id: zoo.id,
        title: zoo.name,
        subtitle: zoo.city.name,
        url: `/zoos/${zoo.slug}`,
        updatedAt: zoo.updatedAt.toISOString(),
      })),
    };
  }
}

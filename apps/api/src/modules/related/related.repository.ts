import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RelatedRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async zoo(id: string) {
    return this.prisma.zoo.findUnique({
      where: { id },
      include: {
        city: { include: { country: true } },
        species: { include: { taxon: true } },
        programs: { include: { program: true } },
        organizations: { include: { organization: true } },
      },
    });
  }

  async taxon(id: string) {
    return this.prisma.taxon.findUnique({
      where: { id },
      include: {
        parent: true,
        children: { take: 8 },
        zoos: { include: { zoo: true }, take: 8 },
        programs: { include: { program: true }, take: 8 },
      },
    });
  }

  async program(id: string) {
    return this.prisma.conservationProgram.findUnique({
      where: { id },
      include: {
        organization: true,
        species: { include: { taxon: true }, take: 8 },
        zoos: { include: { zoo: true }, take: 8 },
      },
    });
  }

  async organization(id: string) {
    return this.prisma.organization.findUnique({
      where: { id },
      include: {
        programs: { take: 8 },
        zoos: { include: { zoo: true }, take: 8 },
      },
    });
  }

  async research(id: string) {
    return this.prisma.researchProject.findUnique({
      where: { id },
      include: {
        zoos: { include: { zoo: true }, take: 8 },
        species: { include: { taxon: true }, take: 8 },
      },
    });
  }

  async country(id: string) {
    const country = await this.prisma.country.findUnique({ where: { id } });
    if (!country) return null;
    const zoos = await this.prisma.zoo.findMany({
      where: { city: { countryId: id }, publishStatus: 'published' },
      take: 8,
      orderBy: { name: 'asc' },
    });
    return { ...country, zoos };
  }

  async city(id: string) {
    return this.prisma.city.findUnique({
      where: { id },
      include: { zoos: { where: { publishStatus: 'published' }, take: 8 } },
    });
  }

  async edges(type: string, id: string) {
    return this.prisma.knowledgeEdge.findMany({
      where: {
        OR: [
          { srcType: type as never, srcId: id },
          { dstType: type as never, dstId: id },
        ],
      },
      include: { predicate: true },
      take: 40,
    });
  }

  async similarZoos(id: string, limit: number) {
    return this.prisma.$queryRaw<Array<{ other_id: string; score: number }>>`
      SELECT CASE WHEN zoo_a = ${id}::uuid THEN zoo_b ELSE zoo_a END AS other_id, score::float8
      FROM v_related_zoos
      WHERE zoo_a = ${id}::uuid OR zoo_b = ${id}::uuid
      ORDER BY score DESC
      LIMIT ${limit}
    `;
  }

  async similarSpecies(id: string, limit: number) {
    return this.prisma.$queryRaw<Array<{ id: string; scientific_name: string; common_name_ru: string | null; slug: string; shared_zoos: number }>>`
      WITH family AS (
        SELECT ancestor.id
        FROM v_taxon_lineage l
        JOIN taxonomic_rank r ON r.id = (SELECT rank_id FROM taxon WHERE id = l.taxon_id)
        JOIN taxon ancestor ON ancestor.id = l.taxon_id
        WHERE l.start_id = ${id}::uuid AND r.code = 'family'
        LIMIT 1
      ),
      family_species AS (
        WITH RECURSIVE d AS (
          SELECT t.id FROM family f JOIN taxon t ON t.id = f.id
          UNION ALL
          SELECT c.id FROM taxon c JOIN d ON c.parent_id = d.id
        )
        SELECT t.id, t.scientific_name, t.common_name_ru, t.slug
        FROM d JOIN taxon t ON t.id = d.id
        JOIN taxonomic_rank r ON r.id = t.rank_id AND r.code = 'species'
        WHERE t.id <> ${id}::uuid
      )
      SELECT fs.id, fs.scientific_name, fs.common_name_ru, fs.slug,
             (SELECT count(*)::int FROM zoo_species a
              JOIN zoo_species b ON a.zoo_id = b.zoo_id
              WHERE a.taxon_id = ${id}::uuid AND b.taxon_id = fs.id) AS shared_zoos
      FROM family_species fs
      ORDER BY shared_zoos DESC, fs.scientific_name
      LIMIT ${limit}
    `;
  }

  async lookup(type: string, ids: string[]): Promise<Array<{ id: string; label: string; subtitle: string | null; slug: string }>> {
    if (ids.length === 0) return [];
    switch (type) {
      case 'zoo': {
        const rows = await this.prisma.zoo.findMany({
          where: { id: { in: ids } },
          select: { id: true, slug: true, name: true, city: { select: { name: true } } },
        });
        return rows.map((row) => ({ id: row.id, label: row.name, subtitle: row.city.name, slug: row.slug }));
      }
      case 'species':
      case 'taxon': {
        const rows = await this.prisma.taxon.findMany({
          where: { id: { in: ids } },
          select: { id: true, slug: true, scientificName: true, commonNameRu: true },
        });
        return rows.map((row) => ({ id: row.id, label: row.scientificName, subtitle: row.commonNameRu, slug: row.slug }));
      }
      case 'program': {
        const rows = await this.prisma.conservationProgram.findMany({
          where: { id: { in: ids } },
          select: { id: true, slug: true, name: true },
        });
        return rows.map((row) => ({ id: row.id, label: row.name, subtitle: null, slug: row.slug }));
      }
      case 'organization': {
        const rows = await this.prisma.organization.findMany({
          where: { id: { in: ids } },
          select: { id: true, slug: true, name: true, acronym: true },
        });
        return rows.map((row) => ({ id: row.id, label: row.name, subtitle: row.acronym, slug: row.slug }));
      }
      case 'research': {
        const rows = await this.prisma.researchProject.findMany({
          where: { id: { in: ids } },
          select: { id: true, slug: true, title: true },
        });
        return rows.map((row) => ({ id: row.id, label: row.title, subtitle: null, slug: row.slug }));
      }
      case 'country': {
        const rows = await this.prisma.country.findMany({
          where: { id: { in: ids } },
          select: { id: true, slug: true, name: true },
        });
        return rows.map((row) => ({ id: row.id, label: row.name, subtitle: null, slug: row.slug }));
      }
      case 'city': {
        const rows = await this.prisma.city.findMany({
          where: { id: { in: ids } },
          select: { id: true, slug: true, name: true },
        });
        return rows.map((row) => ({ id: row.id, label: row.name, subtitle: null, slug: row.slug }));
      }
      default:
        return [];
    }
  }

  async zoosByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return this.prisma.zoo.findMany({
      where: { id: { in: ids } },
      select: { id: true, slug: true, name: true, city: { select: { name: true } } },
    });
  }
}

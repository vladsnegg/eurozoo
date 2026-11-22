import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type CountryListRow = {
  id: string;
  iso2: string;
  iso3: string;
  name: string;
  name_local: string | null;
  slug: string;
  eu_member: boolean;
  zoo_count: number;
  species_count: number;
};

@Injectable()
export class GeographyRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async countries(skip: number, take: number, order: 'asc' | 'desc') {
    const direction = order === 'desc' ? 'DESC' : 'ASC';
    const rows = await this.prisma.$queryRawUnsafe<CountryListRow[]>(
      `SELECT co.id, co.iso2, co.iso3, co.name, co.name_local, co.slug, co.eu_member,
        (SELECT count(*)::int FROM zoo z JOIN city c ON c.id = z.city_id
          WHERE c.country_id = co.id AND z.publish_status = 'published') AS zoo_count,
        (SELECT count(DISTINCT zs.taxon_id)::int FROM zoo_species zs
          JOIN zoo z ON z.id = zs.zoo_id
          JOIN city c ON c.id = z.city_id
          WHERE c.country_id = co.id AND z.publish_status = 'published') AS species_count
       FROM country co
       ORDER BY co.name ${direction}
       LIMIT $1 OFFSET $2`,
      take,
      skip,
    );
    const total = await this.prisma.country.count();
    return { rows, total };
  }

  async country(slug: string) {
    return this.prisma.country.findUnique({
      where: { slug },
      include: {
        regions: { orderBy: { name: 'asc' } },
        cities: { orderBy: { name: 'asc' } },
        organizations: { where: { publishStatus: 'published' }, orderBy: { name: 'asc' } },
      },
    });
  }

  async zoosOfCountry(slug: string) {
    return this.prisma.zoo.findMany({
      where: { publishStatus: 'published', city: { country: { slug } } },
      select: { id: true, slug: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  async speciesCountOfCountry(slug: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<Array<{ count: number }>>`
      SELECT count(DISTINCT zs.taxon_id)::int AS count
      FROM zoo_species zs
      JOIN zoo z ON z.id = zs.zoo_id
      JOIN city c ON c.id = z.city_id
      JOIN country co ON co.id = c.country_id
      WHERE co.slug = ${slug} AND z.publish_status = 'published'
    `;
    return rows[0]?.count ?? 0;
  }

  async city(slug: string) {
    return this.prisma.city.findUnique({
      where: { slug },
      include: {
        country: true,
        region: true,
        zoos: {
          where: { publishStatus: 'published' },
          select: { id: true, slug: true, name: true },
          orderBy: { name: 'asc' },
        },
      },
    });
  }
}

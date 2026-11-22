import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type SearchFilters = {
  types: string[];
  country?: string;
  iucn?: string;
  programCode?: string;
};

export type SearchRow = {
  entity_type: string;
  entity_id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  score: number;
  highlight: string | null;
  country_slug: string | null;
  country_name: string | null;
  iucn_code: string | null;
  iucn_name: string | null;
  program_code: string | null;
};

@Injectable()
export class SearchRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async synonymsFor(raw: string): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<Array<{ term: string; synonym: string }>>`
      SELECT term, synonym FROM search_synonym
      WHERE lower(term) = lower(${raw}) OR lower(synonym) = lower(${raw})
      LIMIT 20
    `;
    const values = new Set<string>();
    for (const row of rows) {
      values.add(row.term);
      values.add(row.synonym);
    }
    return [...values];
  }

  async search(tsquery: string, raw: string, filters: SearchFilters): Promise<SearchRow[]> {
    const types = filters.types.length > 0 ? Prisma.sql`AND m.entity_type = ANY(${filters.types}::text[])` : Prisma.empty;
    const country = filters.country
      ? Prisma.sql`AND co.slug = ${filters.country}`
      : Prisma.empty;
    const iucn = filters.iucn ? Prisma.sql`AND iu.code = ${filters.iucn}` : Prisma.empty;
    const programCode = filters.programCode
      ? Prisma.sql`AND cp.code::text = ${filters.programCode}`
      : Prisma.empty;

    return this.prisma.$queryRaw<SearchRow[]>`
      WITH q AS (
        SELECT websearch_to_tsquery('russian', ${tsquery}) AS ru,
               websearch_to_tsquery('english', ${tsquery}) AS en
      )
      SELECT m.entity_type, m.entity_id, m.slug, m.title, m.subtitle,
             (ts_rank_cd(m.tsv, q.ru) + ts_rank_cd(m.tsv, q.en)
              + similarity(m.title, ${raw}) * 0.6
              + CASE WHEN m.subtitle ILIKE ${'%' + raw + '%'} THEN 0.25 ELSE 0 END
              + CASE m.entity_type
                  WHEN 'zoo' THEN 0.15 WHEN 'species' THEN 0.15
                  WHEN 'program' THEN 0.10 WHEN 'country' THEN 0.05
                  WHEN 'organization' THEN 0.05 ELSE 0 END)::float8 AS score,
             ts_headline('russian', coalesce(m.body, m.title), q.ru,
               'StartSel=, StopSel=, MaxFragments=1, MaxWords=18, MinWords=6') AS highlight,
             co.slug AS country_slug, co.name AS country_name,
             iu.code AS iucn_code, iu.name_ru AS iucn_name,
             cp.code::text AS program_code
      FROM mv_search_index m
      CROSS JOIN q
      LEFT JOIN zoo z ON m.entity_type = 'zoo' AND z.id = m.entity_id
      LEFT JOIN city c ON c.id = z.city_id
      LEFT JOIN country co ON co.id = c.country_id
      LEFT JOIN taxon t ON m.entity_type = 'species' AND t.id = m.entity_id
      LEFT JOIN species_profile sp ON sp.taxon_id = t.id
      LEFT JOIN iucn_status iu ON iu.id = sp.iucn_status_id
      LEFT JOIN conservation_program cp ON m.entity_type = 'program' AND cp.id = m.entity_id
      WHERE (m.tsv @@ q.ru OR m.tsv @@ q.en OR m.title % ${raw} OR m.title ILIKE ${'%' + raw + '%'})
      ${types}
      ${country}
      ${iucn}
      ${programCode}
      ORDER BY score DESC, m.title
      LIMIT 500
    `;
  }

  async suggestions(raw: string) {
    return this.prisma.$queryRaw<
      Array<{ entity_type: string; slug: string; title: string; score: number }>
    >`
      SELECT entity_type, slug, title,
             GREATEST(similarity(title, ${raw}), word_similarity(${raw}, coalesce(body, '')))::float8 AS score
      FROM mv_search_index
      WHERE similarity(title, ${raw}) >= 0.2
         OR word_similarity(${raw}, coalesce(body, '')) >= 0.5
      ORDER BY score DESC
      LIMIT 5
    `;
  }
}

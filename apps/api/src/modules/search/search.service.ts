import { Inject, Injectable } from '@nestjs/common';
import type { SearchResponseDto, SearchResultDto } from '@eurozoo/shared';
import { entityUrl } from '../../common/entity-url';
import { SearchRepository, type SearchFilters, type SearchRow } from './search.repository';

const GROUP_LABELS: Record<string, string> = {
  zoo: 'Зоопарки',
  species: 'Виды',
  program: 'Программы',
  country: 'Страны',
  city: 'Города',
  organization: 'Организации',
  research: 'Исследования',
};

const GROUP_ORDER = ['zoo', 'species', 'program', 'country', 'city', 'organization', 'research'];

@Injectable()
export class SearchService {
  constructor(@Inject(SearchRepository) private readonly repo: SearchRepository) {}

  async search(params: {
    q: string;
    filters: SearchFilters;
    page: number;
    pageSize: number;
  }): Promise<SearchResponseDto> {
    const raw = params.q.trim().slice(0, 200);
    const safe = raw.replace(/[%_\\]/g, ' ').replace(/\s+/g, ' ').trim();
    const synonyms = await this.repo.synonymsFor(raw);

    const terms = [safe, ...synonyms.map((value) => value.replace(/["']/g, ' ').trim())]
      .filter(Boolean)
      .slice(0, 8);

    const tsquery = terms.map((term) => `(${term})`).join(' OR ');
    const rows = await this.repo.search(tsquery, safe, params.filters);

    const total = rows.length;
    const page = params.page;
    const pageSize = params.pageSize;
    const offset = (page - 1) * pageSize;
    const pageRows = rows.slice(offset, offset + pageSize);

    const groups = GROUP_ORDER.map((type) => {
      const items = pageRows
        .filter((row) => row.entity_type === type)
        .map((row) => this.toResult(row));
      return {
        type: type as SearchResultDto['type'],
        label: GROUP_LABELS[type] ?? type,
        total: rows.filter((row) => row.entity_type === type).length,
        items,
      };
    }).filter((group) => group.total > 0);

    const facets = {
      types: GROUP_ORDER.map((type) => ({
        value: type,
        count: rows.filter((row) => row.entity_type === type).length,
      })).filter((facet) => facet.count > 0),
      countries: this.countBy(
        rows.filter((row) => row.country_slug !== null),
        (row) => row.country_slug as string,
        (row) => row.country_name,
      ),
      iucn: this.countBy(
        rows.filter((row) => row.iucn_code !== null),
        (row) => row.iucn_code as string,
        (row) => row.iucn_name,
      ),
      programs: this.countBy(
        rows.filter((row) => row.program_code !== null),
        (row) => row.program_code as string,
        (row) => row.program_code,
      ),
    };

    const suggestions =
      total === 0
        ? (await this.repo.suggestions(safe)).map((row) => ({
            title: row.title,
            url: entityUrl(row.entity_type, row.slug),
            score: Number(row.score),
          }))
        : [];

    return {
      query: raw,
      total,
      page,
      pageSize,
      groups,
      facets,
      suggestions,
    };
  }

  private toResult(row: SearchRow): SearchResultDto {
    return {
      type: row.entity_type as SearchResultDto['type'],
      id: row.entity_id,
      slug: row.slug,
      title: row.title,
      subtitle: row.subtitle,
      url: entityUrl(row.entity_type, row.slug),
      score: Number(row.score),
      highlight: row.highlight,
    };
  }

  private countBy(
    rows: SearchRow[],
    key: (row: SearchRow) => string,
    label: (row: SearchRow) => string | null,
  ) {
    const counts = new Map<string, { label: string; count: number }>();
    for (const row of rows) {
      const value = key(row);
      const current = counts.get(value);
      if (current) current.count += 1;
      else counts.set(value, { label: label(row) ?? value, count: 1 });
    }
    return [...counts.entries()]
      .map(([value, meta]) => ({ value, label: meta.label, count: meta.count }))
      .sort((a, b) => b.count - a.count);
  }
}

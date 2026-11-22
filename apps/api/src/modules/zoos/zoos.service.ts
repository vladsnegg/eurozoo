import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Paginated, ZooDetailDto, ZooSummaryDto } from '@eurozoo/shared';
import { paginated, toDateISO } from '../../common/http/query';
import { toProvenanceDto, toSourceDto } from '../../common/mappers/source';
import { SourcesRepository } from '../sources/sources.repository';
import { ZoosRepository, type ZooListFilters } from './zoos.repository';

@Injectable()
export class ZoosService {
  constructor(
    @Inject(ZoosRepository) private readonly repo: ZoosRepository,
    @Inject(SourcesRepository) private readonly sources: SourcesRepository,
  ) {}

  async list(
    filters: ZooListFilters,
    page: number,
    pageSize: number,
  ): Promise<Paginated<ZooSummaryDto>> {
    const { rows, total } = await this.repo.list(filters);
    const threatened = await this.repo.threatenedZooIds(rows.map((row) => row.id));

    const items: ZooSummaryDto[] = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      nameLocal: row.nameLocal,
      locationLabel: row.locationLabel,
      city: {
        name: row.city.name,
        slug: row.city.slug,
        country: {
          id: row.city.country.id,
          slug: row.city.country.slug,
          name: row.city.country.name,
          iso2: row.city.country.iso2,
        },
      },
      foundedYear: row.foundedYear,
      areaHa: row.areaHa,
      lat: row.lat,
      lng: row.lng,
      status: row.status,
      speciesCount: row._count.species,
      hasPrograms: row._count.programs > 0,
      hasThreatened: threatened.has(row.id),
      updatedAt: row.updatedAt.toISOString(),
    }));

    return paginated(items, total, page, pageSize);
  }

  async detail(slug: string): Promise<ZooDetailDto> {
    const zoo = await this.repo.detail(slug);
    if (!zoo) throw new NotFoundException(`Зоопарк «${slug}» не найден`);

    const sources = await this.sources.forEntity('zoo', zoo.id);

    return {
      id: zoo.id,
      slug: zoo.slug,
      name: zoo.name,
      nameLocal: zoo.nameLocal,
      locationLabel: zoo.locationLabel,
      status: zoo.status,
      foundedYear: zoo.foundedYear,
      areaHa: zoo.areaHa,
      lat: zoo.lat,
      lng: zoo.lng,
      website: zoo.website,
      description: zoo.description,
      annualVisitors: zoo.annualVisitors,
      updatedAt: zoo.updatedAt.toISOString(),
      city: {
        id: zoo.city.id,
        name: zoo.city.name,
        slug: zoo.city.slug,
        lat: zoo.city.lat,
        lng: zoo.city.lng,
        population: zoo.city.population,
        country: {
          id: zoo.city.country.id,
          slug: zoo.city.country.slug,
          name: zoo.city.country.name,
          iso2: zoo.city.country.iso2,
        },
      },
      species: zoo.species.map((entry) => ({
        taxon: {
          id: entry.taxon.id,
          slug: entry.taxon.slug,
          scientificName: entry.taxon.scientificName,
          commonNameRu: entry.taxon.commonNameRu,
          iucn: entry.taxon.profile?.iucnStatus
            ? {
                code: entry.taxon.profile.iucnStatus.code,
                nameRu: entry.taxon.profile.iucnStatus.nameRu,
                severity: entry.taxon.profile.iucnStatus.severity,
                color: entry.taxon.profile.iucnStatus.color,
              }
            : null,
        },
        countMale: entry.countMale,
        countFemale: entry.countFemale,
        countUnsexed: entry.countUnsexed,
        totalCount:
          entry.countMale === null && entry.countFemale === null && entry.countUnsexed === null
            ? null
            : (entry.countMale ?? 0) + (entry.countFemale ?? 0) + (entry.countUnsexed ?? 0),
        breeding: entry.breeding,
        sinceYear: entry.sinceYear,
      })),
      programs: zoo.programs.map((link) => ({
        id: link.program.id,
        slug: link.program.slug,
        name: link.program.name,
        code: link.program.code,
        status: link.program.status,
        role: link.role,
        sinceYear: link.sinceYear,
        untilYear: link.untilYear,
      })),
      organizations: zoo.organizations.map((link) => ({
        id: link.organization.id,
        slug: link.organization.slug,
        name: link.organization.name,
        acronym: link.organization.acronym,
        role: link.role,
        sinceYear: link.sinceYear,
      })),
      research: zoo.research.map((link) => ({
        id: link.research.id,
        slug: link.research.slug,
        title: link.research.title,
        status: link.research.status,
        startedYear: link.research.startedYear,
        endedYear: link.research.endedYear,
      })),
      education: zoo.education.map((item) => ({
        id: item.id,
        title: item.title,
        audience: item.audience,
        format: item.format,
        url: item.url,
      })),
      facilities: zoo.facilities.map((link) => ({
        id: link.facility.id,
        slug: link.facility.slug,
        name: link.facility.name,
        category: link.facility.category,
        note: link.note,
      })),
      events: zoo.events.map((event) => ({
        id: event.id,
        year: event.year,
        exactDate: toDateISO(event.exactDate),
        type: event.type,
        title: event.title,
        description: event.description,
      })),
      enclosures: zoo.enclosures.map((enclosure) => ({
        id: enclosure.id,
        name: enclosure.name,
        type: enclosure.type,
        areaM2: enclosure.areaM2,
      })),
      sources: sources.map(toSourceDto),
      provenance: sources.map(toProvenanceDto),
    };
  }
}

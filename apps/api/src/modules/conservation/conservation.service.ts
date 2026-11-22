import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  OrganizationDetailDto,
  OrganizationSummaryDto,
  Paginated,
  ProgramDetailDto,
  ProgramSummaryDto,
} from '@eurozoo/shared';
import { paginated } from '../../common/http/query';
import { toProvenanceDto, toSourceDto } from '../../common/mappers/source';
import { SourcesRepository } from '../sources/sources.repository';
import { ConservationRepository, type ProgramFilters } from './conservation.repository';

@Injectable()
export class ConservationService {
  constructor(
    @Inject(ConservationRepository) private readonly repo: ConservationRepository,
    @Inject(SourcesRepository) private readonly sources: SourcesRepository,
  ) {}

  async programs(
    filters: ProgramFilters,
    page: number,
    pageSize: number,
  ): Promise<Paginated<ProgramSummaryDto>> {
    const { rows, total } = await this.repo.programs(filters);
    return paginated(
      rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        code: row.code,
        status: row.status,
        organization: row.organization
          ? {
              id: row.organization.id,
              slug: row.organization.slug,
              name: row.organization.name,
              acronym: row.organization.acronym,
            }
          : null,
        startedYear: row.startedYear,
        endedYear: row.endedYear,
        speciesCount: row._count.species,
        zooCount: row._count.zoos,
      })),
      total,
      page,
      pageSize,
    );
  }

  async program(slug: string): Promise<ProgramDetailDto> {
    const program = await this.repo.program(slug);
    if (!program) throw new NotFoundException(`Программа «${slug}» не найдена`);
    const sources = await this.sources.forEntity('program', program.id);

    return {
      id: program.id,
      slug: program.slug,
      name: program.name,
      code: program.code,
      status: program.status,
      organization: program.organization
        ? {
            id: program.organization.id,
            slug: program.organization.slug,
            name: program.organization.name,
            acronym: program.organization.acronym,
          }
        : null,
      startedYear: program.startedYear,
      endedYear: program.endedYear,
      description: program.description,
      species: program.species.map((link) => ({
        taxon: {
          id: link.taxon.id,
          slug: link.taxon.slug,
          scientificName: link.taxon.scientificName,
          commonNameRu: link.taxon.commonNameRu,
          iucn: link.taxon.profile?.iucnStatus
            ? {
                code: link.taxon.profile.iucnStatus.code,
                nameRu: link.taxon.profile.iucnStatus.nameRu,
                severity: link.taxon.profile.iucnStatus.severity,
                color: link.taxon.profile.iucnStatus.color,
              }
            : null,
        },
        role: link.role,
      })),
      zoos: program.zoos.map((link) => ({
        zoo: {
          id: link.zoo.id,
          slug: link.zoo.slug,
          name: link.zoo.name,
          city: {
            id: link.zoo.city.id,
            name: link.zoo.city.name,
            slug: link.zoo.city.slug,
            lat: link.zoo.city.lat,
            lng: link.zoo.city.lng,
            population: link.zoo.city.population,
            country: {
              id: link.zoo.city.country.id,
              slug: link.zoo.city.country.slug,
              name: link.zoo.city.country.name,
              iso2: link.zoo.city.country.iso2,
            },
          },
        },
        role: link.role,
        sinceYear: link.sinceYear,
        untilYear: link.untilYear,
      })),
      research: [],
      sources: sources.map(toSourceDto),
      provenance: sources.map(toProvenanceDto),
    };
  }

  async organizations(
    page: number,
    pageSize: number,
    type?: string,
    country?: string,
  ): Promise<Paginated<OrganizationSummaryDto>> {
    const { rows, total } = await this.repo.organizations(
      (page - 1) * pageSize,
      pageSize,
      type,
      country,
    );
    return paginated(
      rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        acronym: row.acronym,
        type: row.type,
        country: row.country
          ? {
              id: row.country.id,
              slug: row.country.slug,
              name: row.country.name,
              iso2: row.country.iso2,
            }
          : null,
        zooCount: row._count.zoos,
        programCount: row._count.programs,
      })),
      total,
      page,
      pageSize,
    );
  }

  async organization(slug: string): Promise<OrganizationDetailDto> {
    const org = await this.repo.organization(slug);
    if (!org) throw new NotFoundException(`Организация «${slug}» не найдена`);
    const sources = await this.sources.forEntity('organization', org.id);

    return {
      id: org.id,
      slug: org.slug,
      name: org.name,
      acronym: org.acronym,
      type: org.type,
      country: org.country
        ? {
            id: org.country.id,
            slug: org.country.slug,
            name: org.country.name,
            iso2: org.country.iso2,
          }
        : null,
      foundedYear: org.foundedYear,
      website: org.website,
      description: org.description,
      zoos: org.zoos.map((link) => ({
        zoo: { id: link.zoo.id, slug: link.zoo.slug, name: link.zoo.name },
        role: link.role,
        sinceYear: link.sinceYear,
      })),
      programs: org.programs.map((program) => ({
        id: program.id,
        slug: program.slug,
        name: program.name,
        code: program.code,
        status: program.status,
        startedYear: program.startedYear,
      })),
      research: org.ledResearch.map((project) => ({
        id: project.id,
        slug: project.slug,
        title: project.title,
        status: project.status,
      })),
      sources: sources.map(toSourceDto),
    };
  }
}

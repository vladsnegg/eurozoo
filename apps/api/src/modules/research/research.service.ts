import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Paginated, ResearchDetailDto, ResearchSummaryDto } from '@eurozoo/shared';
import { paginated } from '../../common/http/query';
import { toProvenanceDto, toSourceDto } from '../../common/mappers/source';
import { SourcesRepository } from '../sources/sources.repository';
import { ResearchRepository, type ResearchFilters } from './research.repository';

@Injectable()
export class ResearchService {
  constructor(
    @Inject(ResearchRepository) private readonly repo: ResearchRepository,
    @Inject(SourcesRepository) private readonly sources: SourcesRepository,
  ) {}

  async list(
    filters: ResearchFilters,
    page: number,
    pageSize: number,
  ): Promise<Paginated<ResearchSummaryDto>> {
    const { rows, total } = await this.repo.list(filters);
    return paginated(
      rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        status: row.status,
        startedYear: row.startedYear,
        endedYear: row.endedYear,
        leadOrganization: row.leadOrganization
          ? {
              id: row.leadOrganization.id,
              slug: row.leadOrganization.slug,
              name: row.leadOrganization.name,
            }
          : null,
        zooCount: row._count.zoos,
        speciesCount: row._count.species,
      })),
      total,
      page,
      pageSize,
    );
  }

  async detail(slug: string): Promise<ResearchDetailDto> {
    const project = await this.repo.detail(slug);
    if (!project) throw new NotFoundException(`Исследование «${slug}» не найдено`);
    const sources = await this.sources.forEntity('research', project.id);

    return {
      id: project.id,
      slug: project.slug,
      title: project.title,
      status: project.status,
      startedYear: project.startedYear,
      endedYear: project.endedYear,
      leadOrganization: project.leadOrganization
        ? {
            id: project.leadOrganization.id,
            slug: project.leadOrganization.slug,
            name: project.leadOrganization.name,
          }
        : null,
      summary: project.summary,
      zoos: project.zoos.map((link) => ({
        id: link.zoo.id,
        slug: link.zoo.slug,
        name: link.zoo.name,
      })),
      species: project.species.map((link) => ({
        id: link.taxon.id,
        slug: link.taxon.slug,
        scientificName: link.taxon.scientificName,
        commonNameRu: link.taxon.commonNameRu,
      })),
      sources: sources.map(toSourceDto),
      provenance: sources.map(toProvenanceDto),
    };
  }
}

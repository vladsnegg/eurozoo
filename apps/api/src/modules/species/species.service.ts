import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  Paginated,
  SpeciesDetailDto,
  SpeciesSummaryDto,
  TaxonLineageDto,
  TaxonNodeDto,
} from '@eurozoo/shared';
import { paginated } from '../../common/http/query';
import { toProvenanceDto, toSourceDto } from '../../common/mappers/source';
import { SourcesRepository } from '../sources/sources.repository';
import { SpeciesRepository, type SpeciesFilters } from './species.repository';

type TaxonRow = Awaited<ReturnType<SpeciesRepository['lineage']>>[number];

@Injectable()
export class SpeciesService {
  constructor(
    @Inject(SpeciesRepository) private readonly repo: SpeciesRepository,
    @Inject(SourcesRepository) private readonly sources: SourcesRepository,
  ) {}

  async list(
    filters: SpeciesFilters,
    page: number,
    pageSize: number,
  ): Promise<Paginated<SpeciesSummaryDto>> {
    const { rows, total } = await this.repo.list(filters);
    const items: SpeciesSummaryDto[] = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      scientificName: row.scientificName,
      commonNameRu: row.commonNameRu,
      commonNameEn: row.commonNameEn,
      rank: { code: row.rank.code, nameRu: row.rank.nameRu, level: row.rank.level },
      iucn: row.profile?.iucnStatus
        ? {
            code: row.profile.iucnStatus.code,
            nameRu: row.profile.iucnStatus.nameRu,
            severity: row.profile.iucnStatus.severity,
            color: row.profile.iucnStatus.color,
          }
        : null,
      zooCount: row._count.zoos,
      programCount: row._count.programs,
      imageUrl: row.imageUrl,
      imageCredit: row.imageCredit,
      imageCreditUrl: row.imageCreditUrl,
    }));
    return paginated(items, total, page, pageSize);
  }

  async detail(slug: string): Promise<SpeciesDetailDto> {
    const taxon = await this.repo.detail(slug);
    if (!taxon) throw new NotFoundException(`Вид «${slug}» не найден`);

    const [lineage, inferred, sources] = await Promise.all([
      this.repo.lineage(taxon.id),
      this.repo.inferredProgramSpecies(taxon.id),
      this.sources.forEntity('species', taxon.id),
    ]);

    return {
      id: taxon.id,
      slug: taxon.slug,
      scientificName: taxon.scientificName,
      commonNameRu: taxon.commonNameRu,
      commonNameEn: taxon.commonNameEn,
      rank: { code: taxon.rank.code, nameRu: taxon.rank.nameRu, level: taxon.rank.level },
      iucn: taxon.profile?.iucnStatus
        ? {
            code: taxon.profile.iucnStatus.code,
            nameRu: taxon.profile.iucnStatus.nameRu,
            severity: taxon.profile.iucnStatus.severity,
            color: taxon.profile.iucnStatus.color,
          }
        : null,
      description: taxon.profile?.description ?? taxon.description,
      authority: taxon.authority,
      yearDescribed: taxon.yearDescribed,
      imageUrl: taxon.imageUrl,
      imageCredit: taxon.imageCredit,
      imageCreditUrl: taxon.imageCreditUrl,
      profile: taxon.profile
        ? {
            populationTrend: taxon.profile.populationTrend,
            habitatSummary: taxon.profile.habitatSummary,
            dietSummary: taxon.profile.dietSummary,
            lifespanYears: taxon.profile.lifespanYears,
            weightKgMin: taxon.profile.weightKgMin,
            weightKgMax: taxon.profile.weightKgMax,
            lengthCmMin: taxon.profile.lengthCmMin,
            lengthCmMax: taxon.profile.lengthCmMax,
          }
        : null,
      habitats: taxon.habitats.map((link) => ({
        id: link.habitat.id,
        slug: link.habitat.slug,
        name: link.habitat.name,
        biome: link.habitat.biome,
      })),
      lineage: lineage.map((node) => this.toNode(node)),
      zoos: taxon.zoos.map((entry) => ({
        zoo: {
          id: entry.zoo.id,
          slug: entry.zoo.slug,
          name: entry.zoo.name,
          city: {
            id: entry.zoo.city.id,
            name: entry.zoo.city.name,
            slug: entry.zoo.city.slug,
            lat: entry.zoo.city.lat,
            lng: entry.zoo.city.lng,
            population: entry.zoo.city.population,
            country: {
              id: entry.zoo.city.country.id,
              slug: entry.zoo.city.country.slug,
              name: entry.zoo.city.country.name,
              iso2: entry.zoo.city.country.iso2,
            },
          },
        },
        countMale: entry.countMale,
        countFemale: entry.countFemale,
        countUnsexed: entry.countUnsexed,
        breeding: entry.breeding,
        sinceYear: entry.sinceYear,
      })),
      programs: taxon.programs.map((link) => ({
        id: link.program.id,
        slug: link.program.slug,
        name: link.program.name,
        code: link.program.code,
        status: link.program.status,
        role: link.role,
        zooCount: link.program._count.zoos,
      })),
      research: taxon.research.map((link) => ({
        id: link.research.id,
        slug: link.research.slug,
        title: link.research.title,
        status: link.research.status,
        startedYear: link.research.startedYear,
        endedYear: link.research.endedYear,
      })),
      inferredProgramSpecies: inferred.map((row) => ({
        zoo: { id: row.zoo_id, slug: row.zoo_slug, name: row.zoo_name },
        program: { id: row.program_id, slug: row.program_slug, name: row.program_name },
        inferred: true as const,
      })),
      sources: sources.map(toSourceDto),
      provenance: sources.map(toProvenanceDto),
    };
  }

  async lineage(taxonId: string): Promise<TaxonLineageDto> {
    const nodes = await this.repo.lineage(taxonId);
    if (nodes.length === 0) throw new NotFoundException(`Таксон ${taxonId} не найден`);
    return { items: nodes.map((node) => this.toNode(node)) };
  }

  async children(
    taxonId: string,
    page: number,
    pageSize: number,
  ): Promise<Paginated<TaxonNodeDto>> {
    const { rows, total } = await this.repo.children(taxonId, (page - 1) * pageSize, pageSize);
    return paginated(rows.map((row) => this.toNode(row)), total, page, pageSize);
  }

  async nodeBySlug(slug: string): Promise<TaxonNodeDto> {
    const node = await this.repo.bySlug(slug);
    if (!node) throw new NotFoundException(`Таксон «${slug}» не найден`);
    return this.toNode(node);
  }

  async byRank(rankCode: string): Promise<TaxonNodeDto[]> {
    const rows = await this.repo.byRank(rankCode);
    return rows.map((row) => this.toNode(row));
  }

  private toNode(node: TaxonRow): TaxonNodeDto {
    return {
      id: node.id,
      slug: node.slug,
      scientificName: node.scientificName,
      commonNameRu: node.commonNameRu,
      commonNameEn: node.commonNameEn,
      rank: { code: node.rank.code, nameRu: node.rank.nameRu, level: node.rank.level },
      childrenCount: node._count.children,
    };
  }
}

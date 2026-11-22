import { Inject, Injectable } from '@nestjs/common';
import type { RelatedGroupDto, SimilarEntityDto } from '@eurozoo/shared';
import { entityUrl } from '../../common/entity-url';
import { RelatedRepository } from './related.repository';

type Item = { type: string; id: string; label: string; subtitle: string | null; url: string };

@Injectable()
export class RelatedService {
  constructor(@Inject(RelatedRepository) private readonly repo: RelatedRepository) {}

  async related(type: string, id: string, limit: number): Promise<RelatedGroupDto[]> {
    const groups = new Map<string, { labelRu: string; items: Item[] }>();
    const add = (predicate: string, labelRu: string, item: { type: string; id: string; label: string; subtitle?: string | null; slug: string }) => {
      const group = groups.get(predicate) ?? { labelRu, items: [] };
      if (group.items.length >= limit) return;
      group.items.push({
        type: item.type as Item['type'],
        id: item.id,
        label: item.label,
        subtitle: item.subtitle ?? null,
        url: entityUrl(item.type, item.slug),
      });
      groups.set(predicate, group);
    };

    switch (type) {
      case 'zoo': {
        const zoo = await this.repo.zoo(id);
        if (!zoo) return [];
        add('LOCATED_IN', 'находится в', {
          type: 'city',
          id: zoo.city.id,
          label: zoo.city.name,
          subtitle: zoo.city.country.name,
          slug: zoo.city.slug,
        });
        for (const link of zoo.species) {
          add('KEEPS', 'содержит', {
            type: 'species',
            id: link.taxon.id,
            label: link.taxon.scientificName,
            subtitle: link.taxon.commonNameRu,
            slug: link.taxon.slug,
          });
        }
        for (const link of zoo.programs) {
          add('PARTICIPATES_IN', 'участвует в программе', {
            type: 'program',
            id: link.program.id,
            label: link.program.name,
            subtitle: null,
            slug: link.program.slug,
          });
        }
        for (const link of zoo.organizations) {
          add('MEMBER_OF', 'член организации', {
            type: 'organization',
            id: link.organization.id,
            label: link.organization.name,
            subtitle: link.organization.acronym,
            slug: link.organization.slug,
          });
        }
        break;
      }
      case 'species':
      case 'taxon': {
        const taxon = await this.repo.taxon(id);
        if (!taxon) return [];
        if (taxon.parent) {
          add('PART_OF', 'входит в таксон', {
            type: 'taxon',
            id: taxon.parent.id,
            label: taxon.parent.scientificName,
            subtitle: taxon.parent.commonNameRu,
            slug: taxon.parent.slug,
          });
        }
        for (const child of taxon.children) {
          add('PART_OF', 'входит в таксон', {
            type: 'taxon',
            id: child.id,
            label: child.scientificName,
            subtitle: child.commonNameRu,
            slug: child.slug,
          });
        }
        for (const link of taxon.zoos) {
          add('KEEPS', 'содержит', {
            type: 'zoo',
            id: link.zoo.id,
            label: link.zoo.name,
            subtitle: null,
            slug: link.zoo.slug,
          });
        }
        for (const link of taxon.programs) {
          add('TARGETS', 'нацелена на вид', {
            type: 'program',
            id: link.program.id,
            label: link.program.name,
            subtitle: null,
            slug: link.program.slug,
          });
        }
        break;
      }
      case 'program': {
        const program = await this.repo.program(id);
        if (!program) return [];
        if (program.organization) {
          add('OPERATES', 'координирует', {
            type: 'organization',
            id: program.organization.id,
            label: program.organization.name,
            subtitle: program.organization.acronym,
            slug: program.organization.slug,
          });
        }
        for (const link of program.species) {
          add('TARGETS', 'нацелена на вид', {
            type: 'species',
            id: link.taxon.id,
            label: link.taxon.scientificName,
            subtitle: link.taxon.commonNameRu,
            slug: link.taxon.slug,
          });
        }
        for (const link of program.zoos) {
          add('PARTICIPATES_IN', 'участвует в программе', {
            type: 'zoo',
            id: link.zoo.id,
            label: link.zoo.name,
            subtitle: null,
            slug: link.zoo.slug,
          });
        }
        break;
      }
      case 'organization': {
        const org = await this.repo.organization(id);
        if (!org) return [];
        for (const program of org.programs) {
          add('OPERATES', 'координирует', {
            type: 'program',
            id: program.id,
            label: program.name,
            subtitle: null,
            slug: program.slug,
          });
        }
        for (const link of org.zoos) {
          add('MEMBER_OF', 'член организации', {
            type: 'zoo',
            id: link.zoo.id,
            label: link.zoo.name,
            subtitle: null,
            slug: link.zoo.slug,
          });
        }
        break;
      }
      case 'research': {
        const project = await this.repo.research(id);
        if (!project) return [];
        for (const link of project.zoos) {
          add('CONDUCTS', 'проводит исследование', {
            type: 'zoo',
            id: link.zoo.id,
            label: link.zoo.name,
            subtitle: null,
            slug: link.zoo.slug,
          });
        }
        for (const link of project.species) {
          add('STUDIES', 'изучает вид', {
            type: 'species',
            id: link.taxon.id,
            label: link.taxon.scientificName,
            subtitle: link.taxon.commonNameRu,
            slug: link.taxon.slug,
          });
        }
        break;
      }
      case 'country': {
        const country = await this.repo.country(id);
        if (!country) return [];
        for (const zoo of country.zoos) {
          add('LOCATED_IN', 'находится в', {
            type: 'zoo',
            id: zoo.id,
            label: zoo.name,
            subtitle: null,
            slug: zoo.slug,
          });
        }
        break;
      }
      case 'city': {
        const city = await this.repo.city(id);
        if (!city) return [];
        for (const zoo of city.zoos) {
          add('LOCATED_IN', 'находится в', {
            type: 'zoo',
            id: zoo.id,
            label: zoo.name,
            subtitle: null,
            slug: zoo.slug,
          });
        }
        break;
      }
      default:
        return [];
    }

    const edges = await this.repo.edges(type, id);
    for (const edge of edges) {
      const otherType = edge.srcType === type && edge.srcId === id ? edge.dstType : edge.srcType;
      const otherId = edge.srcType === type && edge.srcId === id ? edge.dstId : edge.srcId;
      const [lookup] = await this.repo.lookup(otherType, [otherId]);
      if (lookup) {
        add(edge.predicate.code, edge.predicate.labelRu, { ...lookup, type: otherType });
      }
    }

    return [...groups.entries()].map(([predicate, group]) => ({
      predicate,
      labelRu: group.labelRu,
      items: group.items.map((item) => ({
        type: item.type as RelatedGroupDto['items'][number]['type'],
        id: item.id,
        label: item.label,
        subtitle: item.subtitle,
        url: item.url,
      })),
    }));
  }

  async similar(type: string, id: string, limit: number): Promise<SimilarEntityDto[]> {
    if (type === 'zoo') {
      const rows = await this.repo.similarZoos(id, limit);
      const zoos = await this.repo.zoosByIds(rows.map((row) => row.other_id));
      const byId = new Map(zoos.map((zoo) => [zoo.id, zoo]));
      return rows.flatMap((row) => {
        const zoo = byId.get(row.other_id);
        if (!zoo) return [];
        return [
          {
            type: 'zoo' as const,
            id: zoo.id,
            label: zoo.name,
            url: entityUrl('zoo', zoo.slug),
            score: Number(row.score),
            reason: `общая коллекция видов (совпадение ${Math.round(Number(row.score) * 100)}%)`,
          },
        ];
      });
    }

    if (type === 'species' || type === 'taxon') {
      const rows = await this.repo.similarSpecies(id, limit);
      return rows.map((row) => ({
        type: 'species' as const,
        id: row.id,
        label: row.scientific_name,
        url: entityUrl('species', row.slug),
        score: row.shared_zoos > 0 ? row.shared_zoos / 10 : 0.1,
        reason:
          row.shared_zoos > 0
            ? `одно семейство, общих зоопарков: ${row.shared_zoos}`
            : 'одно семейство',
      }));
    }

    return [];
  }
}

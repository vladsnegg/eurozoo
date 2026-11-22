import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { GraphResponseDto } from '@eurozoo/shared';
import { entityUrl } from '../../common/entity-url';
import { RelatedRepository } from '../related/related.repository';
import { GraphRepository } from './graph.repository';

const MAX_NODES = 200;
const MAX_EDGES = 400;

@Injectable()
export class GraphService {
  constructor(
    @Inject(GraphRepository) private readonly repo: GraphRepository,
    @Inject(RelatedRepository) private readonly lookupRepo: RelatedRepository,
  ) {}

  async predicates(): Promise<Array<{ code: string; labelRu: string }>> {
    const labels = await this.repo.predicateLabels();
    const used = await this.repo.edgePredicates();
    return [...labels.entries()]
      .filter(([code]) => used.includes(code))
      .map(([code, labelRu]) => ({ code, labelRu }))
      .sort((a, b) => a.labelRu.localeCompare(b.labelRu, 'ru'));
  }

  async subgraph(params: {
    seedType: string;
    seedId: string;
    depth: number;
    types: string[];
    predicates: string[];
    includeInferred: boolean;
    limit: number;
  }): Promise<GraphResponseDto> {
    const [seed] = await this.lookupRepo.lookup(params.seedType, [params.seedId]);
    if (!seed) throw new NotFoundException('Стартовая сущность не найдена');

    const available = await this.repo.edgePredicates();
    if (params.predicates.length > 0) {
      const unknown = params.predicates.filter((predicate) => !available.includes(predicate));
      if (unknown.length > 0) {
        throw new BadRequestException(`Неизвестные предикаты: ${unknown.join(', ')}`);
      }
    }

    const rawEdges = await this.repo.traverse({
      seedType: params.seedType,
      seedId: params.seedId,
      depth: params.depth,
      predicates: params.predicates,
      includeInferred: params.includeInferred,
    });

    const typeFilter = params.types.length > 0 ? new Set(params.types) : null;
    const allowed = (type: string) => !typeFilter || typeFilter.has(type);

    const nodeKeys = new Map<string, { type: string; id: string }>();
    nodeKeys.set(`${params.seedType}:${params.seedId}`, {
      type: params.seedType,
      id: params.seedId,
    });

    for (const edge of rawEdges) {
      if (allowed(edge.src_type)) nodeKeys.set(`${edge.src_type}:${edge.src_id}`, { type: edge.src_type, id: edge.src_id });
      if (allowed(edge.dst_type)) nodeKeys.set(`${edge.dst_type}:${edge.dst_id}`, { type: edge.dst_type, id: edge.dst_id });
    }

    const truncated = rawEdges.length > MAX_EDGES || nodeKeys.size > Math.min(params.limit, MAX_NODES);
    const limitedNodes = [...nodeKeys.values()].slice(0, Math.min(params.limit, MAX_NODES));
    const limitedIds = new Set(limitedNodes.map((node) => `${node.type}:${node.id}`));

    const labels = await this.repo.predicateLabels();
    const lookups = new Map<string, { label: string; subtitle: string | null; slug: string }>();

    const byType = new Map<string, string[]>();
    for (const node of limitedNodes) {
      const ids = byType.get(node.type) ?? [];
      ids.push(node.id);
      byType.set(node.type, ids);
    }
    for (const [type, ids] of byType) {
      const rows = await this.lookupRepo.lookup(type, ids);
      for (const row of rows) {
        lookups.set(`${type}:${row.id}`, {
          label: row.label,
          subtitle: row.subtitle,
          slug: row.slug,
        });
      }
    }

    const nodeDegree = new Map<string, number>();
    const edges: GraphResponseDto['edges'] = [];
    const seen = new Set<string>();

    for (const edge of rawEdges) {
      const src = `${edge.src_type}:${edge.src_id}`;
      const dst = `${edge.dst_type}:${edge.dst_id}`;
      if (!limitedIds.has(src) || !limitedIds.has(dst)) continue;

      const key = `${src}|${edge.predicate}|${dst}`;
      if (seen.has(key)) continue;
      seen.add(key);

      if (edges.length >= MAX_EDGES) break;

      edges.push({
        src: edge.src_id,
        dst: edge.dst_id,
        predicate: edge.predicate,
        labelRu: labels.get(edge.predicate) ?? edge.predicate,
        confidence: edge.confidence,
        inferred: edge.inferred,
      });

      nodeDegree.set(src, (nodeDegree.get(src) ?? 0) + 1);
      nodeDegree.set(dst, (nodeDegree.get(dst) ?? 0) + 1);
    }

    const nodes = limitedNodes.map((node) => {
      const key = `${node.type}:${node.id}`;
      const lookup = lookups.get(key);
      return {
        type: node.type as GraphResponseDto['nodes'][number]['type'],
        id: node.id,
        label: lookup?.label ?? node.id,
        subtitle: lookup?.subtitle ?? null,
        url: lookup ? entityUrl(node.type, lookup.slug) : '/',
        degree: nodeDegree.get(key) ?? 0,
      };
    });

    return {
      nodes,
      edges,
      truncated,
      stats: { nodes: nodes.length, edges: edges.length, depth: params.depth },
    };
  }
}

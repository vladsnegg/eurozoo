import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type GraphEdgeRow = {
  src_type: string;
  src_id: string;
  dst_type: string;
  dst_id: string;
  predicate: string;
  confidence: number | null;
  inferred: boolean;
};

@Injectable()
export class GraphRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async traverse(params: {
    seedType: string;
    seedId: string;
    depth: number;
    predicates: string[];
    includeInferred: boolean;
  }): Promise<GraphEdgeRow[]> {
    const { seedType, seedId, depth, predicates, includeInferred } = params;
    return this.prisma.$queryRaw<GraphEdgeRow[]>`
      WITH RECURSIVE reach AS (
        SELECT e.src_type, e.src_id, e.dst_type, e.dst_id, e.predicate, e.confidence, e.inferred, 1 AS depth
        FROM v_all_edges e
        WHERE ((e.src_type = ${seedType} AND e.src_id = ${seedId}::uuid)
            OR (e.dst_type = ${seedType} AND e.dst_id = ${seedId}::uuid))
          AND (cardinality(${predicates}::text[]) = 0 OR e.predicate = ANY(${predicates}::text[]))
          AND (${includeInferred}::boolean OR e.inferred = false)
        UNION
        SELECT e.src_type, e.src_id, e.dst_type, e.dst_id, e.predicate, e.confidence, e.inferred, r.depth + 1
        FROM v_all_edges e
        JOIN reach r
          ON (e.src_type = r.dst_type AND e.src_id = r.dst_id)
          OR (e.dst_type = r.dst_type AND e.dst_id = r.dst_id)
        WHERE r.depth < ${depth}
          AND (cardinality(${predicates}::text[]) = 0 OR e.predicate = ANY(${predicates}::text[]))
          AND (${includeInferred}::boolean OR e.inferred = false)
      )
      SELECT DISTINCT src_type, src_id, dst_type, dst_id, predicate, confidence, inferred
      FROM reach
      LIMIT 1200
    `;
  }

  async edgePredicates(): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<Array<{ predicate: string }>>`
      SELECT DISTINCT predicate FROM v_all_edges
    `;
    return rows.map((row) => row.predicate);
  }

  async predicateLabels(): Promise<Map<string, string>> {
    const rows = await this.prisma.predicate.findMany({
      select: { code: true, labelRu: true },
    });
    return new Map(rows.map((row) => [row.code, row.labelRu]));
  }
}

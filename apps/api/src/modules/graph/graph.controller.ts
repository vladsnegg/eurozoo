import { Controller, Get, Inject, Query } from '@nestjs/common';
import { entityTypeSchema } from '@eurozoo/shared';
import { z } from 'zod';
import { booleanQuery, parseQuery } from '../../common/http/query';
import { GraphService } from './graph.service';

const seedSchema = z
  .string()
  .regex(
    /^(zoo|species|taxon|country|city|program|organization|research):[0-9a-f-]{36}$/i,
    'seed должен иметь вид type:uuid',
  );

const graphQuery = z.object({
  seed: seedSchema,
  depth: z.coerce.number().int().min(1).max(3).default(1),
  types: z.string().max(300).optional(),
  predicates: z.string().max(300).optional(),
  inferred: booleanQuery.default('false'),
  limit: z.coerce.number().int().min(1).max(200).default(200),
});

@Controller('graph')
export class GraphController {
  constructor(@Inject(GraphService) private readonly graph: GraphService) {}

  @Get('predicates')
  async predicates() {
    return this.graph.predicates();
  }

  @Get()
  async subgraph(@Query() rawQuery: Record<string, unknown>) {
    const query = parseQuery(graphQuery, rawQuery);
    const [type, id] = query.seed.split(':');
    entityTypeSchema.parse(type);

    const split = (value?: string) =>
      (value ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

    return this.graph.subgraph({
      seedType: type as string,
      seedId: id as string,
      depth: query.depth,
      types: split(query.types),
      predicates: split(query.predicates),
      includeInferred: query.inferred,
      limit: query.limit,
    });
  }
}

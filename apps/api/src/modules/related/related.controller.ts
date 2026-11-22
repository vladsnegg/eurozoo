import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { entityTypeSchema } from '@eurozoo/shared';
import { z } from 'zod';
import { parseQuery } from '../../common/http/query';
import { RelatedService } from './related.service';

const paramsSchema = z.object({
  type: entityTypeSchema,
  id: z.string().uuid(),
});

const relatedQuery = z.object({ limit: z.coerce.number().int().min(1).max(20).default(8) });
const similarQuery = z.object({ limit: z.coerce.number().int().min(1).max(10).default(4) });

@Controller('entities')
export class RelatedController {
  constructor(@Inject(RelatedService) private readonly related: RelatedService) {}

  @Get(':type/:id/related')
  async list(
    @Param('type') type: string,
    @Param('id') id: string,
    @Query() rawQuery: Record<string, unknown>,
  ) {
    const params = parseQuery(paramsSchema, { type, id });
    const query = parseQuery(relatedQuery, rawQuery);
    return this.related.related(params.type, params.id, query.limit);
  }

  @Get(':type/:id/similar')
  async similar(
    @Param('type') type: string,
    @Param('id') id: string,
    @Query() rawQuery: Record<string, unknown>,
  ) {
    const params = parseQuery(paramsSchema, { type, id });
    const query = parseQuery(similarQuery, rawQuery);
    return this.related.similar(params.type, params.id, query.limit);
  }
}

import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { paginationQuerySchema } from '@eurozoo/shared';
import { z } from 'zod';
import { parseQuery } from '../../common/http/query';
import { SpeciesService } from './species.service';

const taxonomyQuery = z.object({ rank: z.string().min(1).max(40).default('class') });

@Controller()
export class TaxonomyController {
  constructor(@Inject(SpeciesService) private readonly species: SpeciesService) {}

  @Get('taxonomy')
  async byRank(@Query() rawQuery: Record<string, unknown>) {
    const query = parseQuery(taxonomyQuery, rawQuery);
    return this.species.byRank(query.rank);
  }

  @Get('taxa/slug/:slug')
  async bySlug(@Param('slug') slug: string) {
    return this.species.nodeBySlug(slug);
  }

  @Get('taxa/:id/children')
  async children(@Param('id') id: string, @Query() rawQuery: Record<string, unknown>) {
    const query = parseQuery(paginationQuerySchema, rawQuery);
    return this.species.children(id, query.page, query.pageSize);
  }

  @Get('taxa/:id/lineage')
  async lineage(@Param('id') id: string) {
    return this.species.lineage(id);
  }
}

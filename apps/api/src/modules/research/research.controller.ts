import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { paginationQuerySchema } from '@eurozoo/shared';
import { z } from 'zod';
import { parseQuery } from '../../common/http/query';
import { ResearchService } from './research.service';

const researchQuery = paginationQuerySchema.extend({
  status: z.string().min(1).max(20).optional(),
  yearFrom: z.coerce.number().int().min(1200).max(2100).optional(),
  yearTo: z.coerce.number().int().min(1200).max(2100).optional(),
  country: z.string().min(1).max(80).optional(),
});

@Controller('research')
export class ResearchController {
  constructor(@Inject(ResearchService) private readonly research: ResearchService) {}

  @Get()
  async list(@Query() rawQuery: Record<string, unknown>) {
    const query = parseQuery(researchQuery, rawQuery);
    return this.research.list(
      {
        status: query.status,
        yearFrom: query.yearFrom,
        yearTo: query.yearTo,
        country: query.country,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      },
      query.page,
      query.pageSize,
    );
  }

  @Get(':slug')
  async detail(@Param('slug') slug: string) {
    return this.research.detail(slug);
  }
}

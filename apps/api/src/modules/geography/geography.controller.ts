import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { paginationQuerySchema } from '@eurozoo/shared';
import { z } from 'zod';
import { parseQuery } from '../../common/http/query';
import { GeographyService } from './geography.service';

const countriesQuery = paginationQuerySchema.extend({
  order: z.enum(['asc', 'desc']).default('asc'),
});

@Controller()
export class GeographyController {
  constructor(@Inject(GeographyService) private readonly geography: GeographyService) {}

  @Get('countries')
  async countries(@Query() rawQuery: Record<string, unknown>) {
    const query = parseQuery(countriesQuery, rawQuery);
    return this.geography.countries(query.page, query.pageSize, query.order);
  }

  @Get('countries/:slug')
  async country(@Param('slug') slug: string) {
    return this.geography.country(slug);
  }

  @Get('cities/:slug')
  async city(@Param('slug') slug: string) {
    return this.geography.city(slug);
  }
}

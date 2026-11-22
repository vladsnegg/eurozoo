import { BadRequestException, Controller, Get, Inject, Query } from '@nestjs/common';
import {
  entityTypeSchema,
  paginationQuerySchema,
  programCodeSchema,
} from '@eurozoo/shared';
import { z } from 'zod';
import { parseQuery } from '../../common/http/query';
import { SearchService } from './search.service';

const searchQuery = paginationQuerySchema.extend({
  q: z.string().min(1, 'Параметр q обязателен').max(200),
  types: z.string().max(200).optional(),
  country: z.string().min(1).max(80).optional(),
  iucn: z.string().min(2).max(2).optional(),
  programCode: programCodeSchema.optional(),
});

@Controller('search')
export class SearchController {
  constructor(@Inject(SearchService) private readonly search: SearchService) {}

  @Get()
  async run(@Query() rawQuery: Record<string, unknown>) {
    const query = parseQuery(searchQuery, rawQuery);
    const types = (query.types ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    for (const type of types) {
      if (!entityTypeSchema.safeParse(type).success) {
        throw new BadRequestException(`Неизвестный тип сущности «${type}»`);
      }
    }

    return this.search.search({
      q: query.q,
      filters: {
        types,
        country: query.country,
        iucn: query.iucn,
        programCode: query.programCode,
      },
      page: query.page,
      pageSize: query.pageSize,
    });
  }
}

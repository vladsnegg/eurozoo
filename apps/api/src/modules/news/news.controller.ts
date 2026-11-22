import { Controller, Get, Inject, Query } from '@nestjs/common';
import { paginationQuerySchema } from '@eurozoo/shared';
import { z } from 'zod';
import { parseQuery } from '../../common/http/query';
import { NewsService } from './news.service';

const newsQuery = paginationQuerySchema.extend({
  zoo: z.string().min(1).max(80).optional(),
});

@Controller('news')
export class NewsController {
  constructor(@Inject(NewsService) private readonly news: NewsService) {}

  @Get()
  async list(@Query() rawQuery: Record<string, unknown>) {
    const query = parseQuery(newsQuery, rawQuery);
    return this.news.list(query.zoo, query.page, query.pageSize);
  }
}

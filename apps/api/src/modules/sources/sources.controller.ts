import { Controller, Get, Inject, Query } from '@nestjs/common';
import { paginationQuerySchema, reliabilitySchema, sourceTypeSchema } from '@eurozoo/shared';
import { paginated, parseQuery } from '../../common/http/query';
import { sourceToDto } from '../../common/mappers/source';
import { SourcesRepository } from './sources.repository';

const sourcesQuery = paginationQuerySchema.extend({
  type: sourceTypeSchema.optional(),
  reliability: reliabilitySchema.optional(),
});

@Controller('sources')
export class SourcesController {
  constructor(@Inject(SourcesRepository) private readonly sources: SourcesRepository) {}

  @Get()
  async list(@Query() rawQuery: Record<string, unknown>) {
    const query = parseQuery(sourcesQuery, rawQuery);
    const { rows, total } = await this.sources.listPublic(
      (query.page - 1) * query.pageSize,
      query.pageSize,
      query.type,
      query.reliability,
    );
    return paginated(rows.map(sourceToDto), total, query.page, query.pageSize);
  }
}

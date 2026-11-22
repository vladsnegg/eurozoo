import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { paginationQuerySchema, programCodeSchema, programStatusSchema } from '@eurozoo/shared';
import { z } from 'zod';
import { parseQuery } from '../../common/http/query';
import { ConservationService } from './conservation.service';

const programsQuery = paginationQuerySchema.extend({
  code: programCodeSchema.optional(),
  status: programStatusSchema.optional(),
  organization: z.string().min(1).max(80).optional(),
  country: z.string().min(1).max(80).optional(),
});

const organizationsQuery = paginationQuerySchema.extend({
  type: z.string().min(1).max(40).optional(),
  country: z.string().min(1).max(80).optional(),
});

@Controller('programs')
export class ProgramsController {
  constructor(@Inject(ConservationService) private readonly service: ConservationService) {}

  @Get()
  async list(@Query() rawQuery: Record<string, unknown>) {
    const query = parseQuery(programsQuery, rawQuery);
    return this.service.programs(
      {
        code: query.code,
        status: query.status,
        organization: query.organization,
        country: query.country,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        order: query.order,
      },
      query.page,
      query.pageSize,
    );
  }

  @Get(':slug')
  async detail(@Param('slug') slug: string) {
    return this.service.program(slug);
  }
}

@Controller('organizations')
export class OrganizationsController {
  constructor(@Inject(ConservationService) private readonly service: ConservationService) {}

  @Get()
  async list(@Query() rawQuery: Record<string, unknown>) {
    const query = parseQuery(organizationsQuery, rawQuery);
    return this.service.organizations(query.page, query.pageSize, query.type, query.country);
  }

  @Get(':slug')
  async detail(@Param('slug') slug: string) {
    return this.service.organization(slug);
  }
}

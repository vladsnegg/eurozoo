import { BadRequestException, Controller, Get, Inject, Param, Query } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { paginationQuerySchema } from '@eurozoo/shared';
import { z } from 'zod';
import { booleanQuery, parseQuery } from '../../common/http/query';
import { SpeciesService } from './species.service';

const speciesListQuery = paginationQuerySchema.extend({
  iucn: z.string().min(2).max(2).optional(),
  class: z.string().min(1).max(80).optional(),
  order: z.enum(['asc', 'desc']).default('asc'),
  family: z.string().min(1).max(80).optional(),
  habitat: z.string().min(1).max(80).optional(),
  country: z.string().min(1).max(80).optional(),
  hasPrograms: booleanQuery.optional(),
});

const SORTS: Record<string, Prisma.TaxonOrderByWithRelationInput> = {
  scientificName: { scientificName: 'asc' },
  zooCount: { zoos: { _count: 'desc' } },
  programCount: { programs: { _count: 'desc' } },
};

@Controller('species')
export class SpeciesController {
  constructor(@Inject(SpeciesService) private readonly species: SpeciesService) {}

  @Get()
  async list(@Query() rawQuery: Record<string, unknown>) {
    const query = parseQuery(speciesListQuery, rawQuery);
    const sortKey = query.sort ?? 'scientificName';
    const orderBy = SORTS[sortKey];
    if (!orderBy) throw new BadRequestException(`Неизвестная сортировка «${sortKey}»`);

    return this.species.list(
      {
        iucn: query.iucn,
        className: query.class,
        family: query.family,
        habitat: query.habitat,
        country: query.country,
        hasPrograms: query.hasPrograms,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: invertIfNeeded(orderBy, query.order),
      },
      query.page,
      query.pageSize,
    );
  }

  @Get(':slug')
  async detail(@Param('slug') slug: string) {
    return this.species.detail(slug);
  }
}

function invertIfNeeded(
  orderBy: Prisma.TaxonOrderByWithRelationInput,
  order: 'asc' | 'desc',
): Prisma.TaxonOrderByWithRelationInput {
  if (order === 'asc') return orderBy;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(orderBy)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = invertIfNeeded(value as Prisma.TaxonOrderByWithRelationInput, order);
    } else {
      result[key] = value === 'asc' ? 'desc' : 'asc';
    }
  }
  return result as Prisma.TaxonOrderByWithRelationInput;
}

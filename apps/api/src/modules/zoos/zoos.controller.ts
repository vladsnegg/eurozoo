import { BadRequestException, Controller, Get, Inject, Param, Query } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { paginationQuerySchema, zooStatusSchema } from '@eurozoo/shared';
import { z } from 'zod';
import { booleanQuery, parseQuery } from '../../common/http/query';
import { ZoosService } from './zoos.service';

const zooListQuery = paginationQuerySchema.extend({
  country: z.string().min(1).max(80).optional(),
  city: z.string().min(1).max(80).optional(),
  yearFrom: z.coerce.number().int().min(1200).max(2100).optional(),
  yearTo: z.coerce.number().int().min(1200).max(2100).optional(),
  hasPrograms: booleanQuery.optional(),
  hasThreatened: booleanQuery.optional(),
  hasCoords: booleanQuery.optional(),
  status: zooStatusSchema.optional(),
});

const SORTS: Record<string, Prisma.ZooOrderByWithRelationInput> = {
  name: { name: 'asc' },
  foundedYear: { foundedYear: 'asc' },
  updatedAt: { updatedAt: 'desc' },
  speciesCount: { species: { _count: 'desc' } },
};

@Controller('zoos')
export class ZoosController {
  constructor(@Inject(ZoosService) private readonly zoos: ZoosService) {}

  @Get()
  async list(@Query() rawQuery: Record<string, unknown>) {
    const query = parseQuery(zooListQuery, rawQuery);
    const sortKey = query.sort ?? 'name';
    const orderBy = SORTS[sortKey];
    if (!orderBy) {
      throw new BadRequestException(`Неизвестная сортировка «${sortKey}»`);
    }

    return this.zoos.list(
      {
        country: query.country,
        city: query.city,
        yearFrom: query.yearFrom,
        yearTo: query.yearTo,
        hasPrograms: query.hasPrograms,
        hasThreatened: query.hasThreatened,
        hasCoords: query.hasCoords,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: query.order === 'desc' ? invert(orderBy) : orderBy,
      },
      query.page,
      query.pageSize,
    );
  }

  @Get(':slug')
  async detail(@Param('slug') slug: string) {
    return this.zoos.detail(slug);
  }
}

function invert(
  orderBy: Prisma.ZooOrderByWithRelationInput,
): Prisma.ZooOrderByWithRelationInput {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(orderBy)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = invert(value as Prisma.ZooOrderByWithRelationInput);
    } else {
      result[key] = value === 'asc' ? 'desc' : 'asc';
    }
  }
  return result as Prisma.ZooOrderByWithRelationInput;
}

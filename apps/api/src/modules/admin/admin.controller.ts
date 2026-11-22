import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { paginationQuerySchema } from '@eurozoo/shared';
import { parseQuery } from '../../common/http/query';
import { Roles, RolesGuard, SessionGuard } from '../auth/guards';
import { AdminService } from './admin.service';

const listQuery = paginationQuerySchema.extend({
  q: z.string().max(120).optional(),
  status: z.enum(['draft', 'review', 'published']).optional(),
});

const revisionsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  entityType: z.string().max(40).optional(),
  entityId: z.string().uuid().optional(),
});

const relationsBody = z.object({ ids: z.array(z.string().uuid()).max(200) });
const verifyBody = z.object({ sourceId: z.string().uuid() });

@Controller('admin')
@UseGuards(SessionGuard, RolesGuard)
@Roles('editor', 'admin')
export class AdminController {
  constructor(@Inject(AdminService) private readonly admin: AdminService) {}

  @Get('dashboard')
  async dashboard() {
    return this.admin.dashboard();
  }

  @Get('revisions')
  async revisions(@Query() rawQuery: Record<string, unknown>) {
    return this.admin.revisions(parseQuery(revisionsQuery, rawQuery));
  }

  @Get('users')
  @Roles('admin')
  async users() {
    return this.admin.users();
  }

  @Post('users')
  @Roles('admin')
  async createUser(@Body() body: unknown) {
    return this.admin.createUser(body);
  }

  @Patch('users/:id')
  @Roles('admin')
  async updateUser(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() request: Request,
  ) {
    return this.admin.updateUser(id, body, { id: request.user!.id });
  }

  @Post('search/refresh')
  @Roles('admin')
  async refreshSearch() {
    return this.admin.refreshSearch();
  }

  @Get(':resource')
  async list(
    @Param('resource') resource: string,
    @Query() rawQuery: Record<string, unknown>,
  ) {
    return this.admin.list(resource, parseQuery(listQuery, rawQuery));
  }

  @Get(':resource/:id')
  async get(@Param('resource') resource: string, @Param('id') id: string) {
    return this.admin.get(resource, id);
  }

  @Post(':resource')
  async create(
    @Param('resource') resource: string,
    @Body() body: unknown,
    @Req() request: Request,
  ) {
    return this.admin.create(resource, body, { id: request.user!.id });
  }

  @Patch(':resource/:id')
  async update(
    @Param('resource') resource: string,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() request: Request,
  ) {
    return this.admin.update(resource, id, body, { id: request.user!.id });
  }

  @Delete(':resource/:id')
  @Roles('admin')
  async remove(
    @Param('resource') resource: string,
    @Param('id') id: string,
    @Req() request: Request,
  ) {
    return this.admin.remove(resource, id, { id: request.user!.id });
  }

  @Post(':resource/:id/publish')
  async publish(
    @Param('resource') resource: string,
    @Param('id') id: string,
    @Req() request: Request,
  ) {
    return this.admin.publish(resource, id, { id: request.user!.id });
  }

  @Post(':resource/:id/verify')
  async verify(
    @Param('resource') resource: string,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() request: Request,
  ) {
    const { sourceId } = parseQuery(verifyBody, body);
    return this.admin.verify(resource, id, sourceId, { id: request.user!.id });
  }

  @Put(':resource/:id/relations/:relation')
  async relations(
    @Param('resource') resource: string,
    @Param('id') id: string,
    @Param('relation') relation: string,
    @Body() body: unknown,
  ) {
    const { ids } = parseQuery(relationsBody, body);
    return this.admin.relations(resource, id, relation, ids);
  }
}

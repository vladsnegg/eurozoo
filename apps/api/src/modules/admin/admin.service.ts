import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { EntityType } from '@prisma/client';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { resourceConfig } from './resources';

type AdminDelegate = {
  findMany(args: unknown): Promise<unknown[]>;
  findUnique(args: unknown): Promise<Record<string, unknown> | null>;
  create(args: unknown): Promise<Record<string, unknown>>;
  update(args: unknown): Promise<Record<string, unknown>>;
  delete(args: unknown): Promise<Record<string, unknown>>;
  count(args: unknown): Promise<number>;
};

type Actor = { id: string };

@Injectable()
export class AdminService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuthService) private readonly auth: AuthService,
  ) {}

  private delegate(name: string): AdminDelegate {
    const delegate = (this.prisma as unknown as Record<string, AdminDelegate>)[name];
    if (!delegate) throw new NotFoundException(`Неизвестный ресурс «${name}»`);
    return delegate;
  }

  async list(resource: string, params: { page: number; pageSize: number; q?: string; status?: string }) {
    const config = resourceConfig(resource);
    const where: Record<string, unknown> = {};
    if (params.q) {
      where.OR = config.searchFields.map((field) => ({
        [field]: { contains: params.q, mode: 'insensitive' },
      }));
    }
    if (params.status && ['draft', 'review', 'published'].includes(params.status)) {
      where.publishStatus = params.status;
    }

    const delegate = this.delegate(config.delegate);
    const [items, total] = await Promise.all([
      delegate.findMany({
        where,
        orderBy: config.orderBy,
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      delegate.count({ where }),
    ]);

    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  async get(resource: string, id: string) {
    const config = resourceConfig(resource);
    const row = await this.delegate(config.delegate).findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Запись не найдена');
    return row;
  }

  async create(resource: string, body: unknown, actor: Actor) {
    const config = resourceConfig(resource);
    const data = config.create.parse(body);
    const row = await this.delegate(config.delegate).create({ data });
    await this.revision(config.entityType, String(row.id), 'create', actor.id, data);
    return row;
  }

  async update(resource: string, id: string, body: unknown, actor: Actor) {
    const config = resourceConfig(resource);
    const existing = await this.get(resource, id);
    const data = config.create.partial().parse(body) as Record<string, unknown>;
    const row = await this.delegate(config.delegate).update({ where: { id }, data });

    const changed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && JSON.stringify(existing[key]) !== JSON.stringify(value)) {
        changed[key] = value;
      }
    }
    await this.revision(config.entityType, id, 'update', actor.id, changed);
    return row;
  }

  async remove(resource: string, id: string, actor: Actor) {
    const config = resourceConfig(resource);
    try {
      await this.delegate(config.delegate).delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2003', 'P2014'].includes(error.code)) {
        throw new ConflictException('Нельзя удалить запись: есть зависимые данные');
      }
      throw error;
    }
    await this.revision(config.entityType, id, 'delete', actor.id, { id });
  }

  async publish(resource: string, id: string, actor: Actor) {
    const config = resourceConfig(resource);
    if (!config.publishable || !config.entityType) {
      throw new UnprocessableEntityException('Ресурс не поддерживает публикацию');
    }
    await this.get(resource, id);

    const source = await this.prisma.entitySource.findFirst({
      where: {
        entityType: config.entityType,
        entityId: id,
        status: 'current',
        verifiedAt: { not: null },
      },
    });
    if (!source) {
      throw new UnprocessableEntityException(
        'Публикация невозможна: добавьте проверенный источник',
      );
    }

    const row = await this.delegate(config.delegate).update({
      where: { id },
      data: { publishStatus: 'published' },
    });
    await this.revision(config.entityType, id, 'publish', actor.id, { publishStatus: 'published' });
    return row;
  }

  async verify(resource: string, id: string, sourceId: string, actor: Actor) {
    const config = resourceConfig(resource);
    if (!config.entityType) throw new UnprocessableEntityException('Ресурс не поддерживает источники');
    await this.get(resource, id);

    const now = new Date();
    const staleAfter = new Date(now.getTime() + 365 * 86400000);
    const result = await this.prisma.entitySource.updateMany({
      where: { entityType: config.entityType, entityId: id, sourceId },
      data: { verifiedAt: now, status: 'current', staleAfter },
    });
    if (result.count === 0) {
      throw new UnprocessableEntityException('Связь с источником не найдена');
    }
    await this.revision(config.entityType, id, 'verify', actor.id, { sourceId });
    return { updated: result.count };
  }

  async relations(resource: string, id: string, relation: string, ids: string[]) {
    const key = `${resource}:${relation}`;
    const prisma = this.prisma;

    switch (key) {
      case 'zoos:species':
        await prisma.$transaction([
          prisma.zooSpecies.deleteMany({ where: { zooId: id } }),
          prisma.zooSpecies.createMany({
            data: ids.map((taxonId) => ({ zooId: id, taxonId })),
            skipDuplicates: true,
          }),
        ]);
        break;
      case 'zoos:programs':
        await prisma.$transaction([
          prisma.zooProgram.deleteMany({ where: { zooId: id } }),
          prisma.zooProgram.createMany({
            data: ids.map((programId) => ({ zooId: id, programId })),
            skipDuplicates: true,
          }),
        ]);
        break;
      case 'zoos:organizations':
        await prisma.$transaction([
          prisma.zooOrganization.deleteMany({ where: { zooId: id } }),
          prisma.zooOrganization.createMany({
            data: ids.map((organizationId) => ({ zooId: id, organizationId })),
            skipDuplicates: true,
          }),
        ]);
        break;
      case 'programs:species':
        await prisma.$transaction([
          prisma.programSpecies.deleteMany({ where: { programId: id } }),
          prisma.programSpecies.createMany({
            data: ids.map((taxonId) => ({ programId: id, taxonId })),
            skipDuplicates: true,
          }),
        ]);
        break;
      case 'programs:zoos':
        await prisma.$transaction([
          prisma.zooProgram.deleteMany({ where: { programId: id } }),
          prisma.zooProgram.createMany({
            data: ids.map((zooId) => ({ zooId, programId: id })),
            skipDuplicates: true,
          }),
        ]);
        break;
      case 'organizations:zoos':
        await prisma.$transaction([
          prisma.zooOrganization.deleteMany({ where: { organizationId: id } }),
          prisma.zooOrganization.createMany({
            data: ids.map((zooId) => ({ zooId, organizationId: id })),
            skipDuplicates: true,
          }),
        ]);
        break;
      case 'research:zoos':
        await prisma.$transaction([
          prisma.zooResearch.deleteMany({ where: { researchId: id } }),
          prisma.zooResearch.createMany({
            data: ids.map((zooId) => ({ zooId, researchId: id })),
            skipDuplicates: true,
          }),
        ]);
        break;
      case 'research:species':
        await prisma.$transaction([
          prisma.researchSpecies.deleteMany({ where: { researchId: id } }),
          prisma.researchSpecies.createMany({
            data: ids.map((taxonId) => ({ researchId: id, taxonId })),
            skipDuplicates: true,
          }),
        ]);
        break;
      default:
        throw new NotFoundException(`Связь «${relation}» не поддерживается для «${resource}»`);
    }

    await this.prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_search_index');
    return { updated: ids.length };
  }

  async revisions(params: { page: number; pageSize: number; entityType?: string; entityId?: string }) {
    const where: Prisma.KnowledgeRevisionWhereInput = {
      entityType: params.entityType ? (params.entityType as EntityType) : undefined,
      entityId: params.entityId,
    };
    const [items, total] = await Promise.all([
      this.prisma.knowledgeRevision.findMany({
        where,
        include: { actor: { select: { email: true, displayName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.knowledgeRevision.count({ where }),
    ]);
    return {
      items: items.map((item) => ({ ...item, id: item.id.toString() })),
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  async users() {
    return this.prisma.appUser.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { email: 'asc' },
    });
  }

  async createUser(body: unknown) {
    const data = userCreateSchema.parse(body);
    const passwordHash = await this.auth.hashPassword(data.password);
    return this.prisma.appUser.create({
      data: {
        email: data.email.toLowerCase(),
        displayName: data.displayName,
        role: data.role,
        passwordHash,
      },
      select: { id: true, email: true, displayName: true, role: true, isActive: true },
    });
  }

  async updateUser(id: string, body: unknown, actor: Actor) {
    const data = userUpdateSchema.parse(body);
    const user = await this.prisma.appUser.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const wantsDemotion = data.role && data.role !== 'admin';
    const wantsDeactivate = data.isActive === false;
    if ((wantsDemotion || wantsDeactivate) && user.role === 'admin') {
      const admins = await this.prisma.appUser.count({ where: { role: 'admin', isActive: true } });
      if (admins <= 1) throw new UnprocessableEntityException('Нельзя оставить систему без администратора');
    }

    const updated = await this.prisma.appUser.update({
      where: { id },
      data,
      select: { id: true, email: true, displayName: true, role: true, isActive: true },
    });

    if (data.isActive === false) {
      await this.prisma.session.deleteMany({ where: { userId: id } });
    }
    await this.revision('source', id, 'user_update', actor.id, data);
    return updated;
  }

  async dashboard() {
    const [drafts, publishedZoos, missingSources, stale, recent] = await Promise.all([
      this.prisma.zoo.count({ where: { publishStatus: { not: 'published' } } }),
      this.prisma.zoo.count({ where: { publishStatus: 'published' } }),
      this.prisma.$queryRaw<Array<{ count: number }>>`
        SELECT count(*)::int AS count FROM zoo z
        WHERE z.publish_status = 'published' AND NOT EXISTS (
          SELECT 1 FROM entity_source es
          WHERE es.entity_type = 'zoo' AND es.entity_id = z.id
            AND es.status = 'current' AND es.verified_at IS NOT NULL
        )
      `,
      this.prisma.entitySource.count({ where: { staleAfter: { lt: new Date() } } }),
      this.prisma.knowledgeRevision.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { email: true } } },
      }),
    ]);

    const counts = await Promise.all(
      ['zoo', 'taxon', 'source', 'conservationProgram', 'organization', 'researchProject'].map(
        async (model) => {
          const delegate = (this.prisma as unknown as Record<string, { count: () => Promise<number> }>)[
            model
          ];
          if (!delegate) return { model, count: 0 };
          return { model, count: await delegate.count() };
        },
      ),
    );

    return {
      counts,
      zoos: { draft: drafts, published: publishedZoos, missingSources: missingSources[0]?.count ?? 0 },
      stale,
      recent: recent.map((item) => ({ ...item, id: item.id.toString() })),
    };
  }

  async refreshSearch() {
    await this.prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_search_index');
    return { ok: true };
  }

  private async revision(
    entityType: EntityType | undefined,
    entityId: string,
    action: string,
    actorId: string,
    diff: unknown,
  ): Promise<void> {
    if (!entityType) return;
    await this.prisma.knowledgeRevision.create({
      data: {
        entityType,
        entityId,
        action,
        actorId,
        diff: diff as Prisma.InputJsonValue,
      },
    });
  }
}

const userCreateSchema = z.object({
  email: z.string().email().max(255),
  displayName: z.string().min(1).max(120),
  role: z.enum(['viewer', 'editor', 'admin']),
  password: z.string().min(12).max(200),
});

const userUpdateSchema = z.object({
  displayName: z.string().min(1).max(120).optional(),
  role: z.enum(['viewer', 'editor', 'admin']).optional(),
  isActive: z.boolean().optional(),
});


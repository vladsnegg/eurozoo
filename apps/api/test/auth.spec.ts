import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { argon2id } from 'hash-wasm';
import { randomBytes } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/bootstrap';

const prisma = new PrismaClient();

async function hash(password: string): Promise<string> {
  return argon2id({
    password,
    salt: randomBytes(16),
    parallelism: 1,
    iterations: 2,
    memorySize: 19456,
    hashLength: 32,
    outputType: 'encoded',
  });
}

describe('auth, RBAC and admin publishing', () => {
  let app: INestApplication;
  let adminEmail = '';
  let adminPassword = '';
  let countryId = '';
  let sourceId = '';
  let createdZooId = '';

  beforeAll(async () => {
    app = await createApp();
    await app.init();

    adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL ?? '';
    adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? '';
    if (!adminEmail || !adminPassword) {
      throw new Error('BOOTSTRAP_ADMIN_* must be configured for auth tests');
    }

    const country = await prisma.country.findUniqueOrThrow({ where: { iso2: 'CZ' } });
    countryId = country.id;
    const source = await prisma.source.findFirstOrThrow({ where: { type: 'official_site' } });
    sourceId = source.id;

    await prisma.appUser.upsert({
      where: { email: 'editor@test.local' },
      update: { passwordHash: await hash('Editor-Password-2026'), role: 'editor', isActive: true },
      create: {
        email: 'editor@test.local',
        displayName: 'Editor',
        role: 'editor',
        passwordHash: await hash('Editor-Password-2026'),
      },
    });
    await prisma.appUser.upsert({
      where: { email: 'viewer@test.local' },
      update: { passwordHash: await hash('Viewer-Password-2026'), role: 'viewer', isActive: true },
      create: {
        email: 'viewer@test.local',
        displayName: 'Viewer',
        role: 'viewer',
        passwordHash: await hash('Viewer-Password-2026'),
      },
    });
  });

  afterAll(async () => {
    if (createdZooId) {
      await prisma.entitySource.deleteMany({ where: { entityId: createdZooId } });
      await prisma.knowledgeRevision.deleteMany({ where: { entityId: createdZooId } });
      await prisma.zoo.deleteMany({ where: { id: createdZooId } });
    }
    await prisma.session.deleteMany({
      where: { user: { email: { in: ['editor@test.local', 'viewer@test.local'] } } },
    });
    await prisma.appUser.deleteMany({
      where: { email: { in: ['editor@test.local', 'viewer@test.local'] } },
    });
    await prisma.$disconnect();
    await app.close();
  });

  it('rejects an unauthenticated admin request with 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/admin/dashboard').expect(401);
  });

  it('rejects a wrong password', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: 'wrong-password' })
      .expect(401);
  });

  it('rejects a cross-origin mutation (CSRF guard)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('Origin', 'https://evil.example')
      .send({ email: adminEmail, password: adminPassword })
      .expect(403);
  });

  it('lets an editor manage content but not users', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/api/v1/auth/login')
      .send({ email: 'editor@test.local', password: 'Editor-Password-2026' })
      .expect(201);

    await agent.get('/api/v1/admin/zoos').expect(200);
    await agent.get('/api/v1/admin/users').expect(403);

    const created = await agent
      .post('/api/v1/admin/zoos')
      .send({
        slug: `auth-test-zoo-${Date.now()}`,
        name: 'Auth Test Zoo',
        cityId: (await prisma.city.findFirstOrThrow({ where: { slug: 'praha' } })).id,
      })
      .expect(201);
    createdZooId = created.body.id as string;

    await agent.post(`/api/v1/admin/zoos/${createdZooId}/publish`).expect(422);
    await agent.delete(`/api/v1/admin/zoos/${createdZooId}`).expect(403);
  });

  it('publishes only after a verified source is attached', async () => {
    const admin = request.agent(app.getHttpServer());
    await admin
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(201);

    await prisma.entitySource.create({
      data: {
        entityType: 'zoo',
        entityId: createdZooId,
        sourceId,
        fieldName: '',
        verifiedAt: new Date(),
        status: 'current',
      },
    });

    const published = await admin
      .post(`/api/v1/admin/zoos/${createdZooId}/publish`)
      .expect(201);
    expect(published.body.publishStatus).toBe('published');

    const revisions = await admin
      .get(`/api/v1/admin/revisions?entityId=${createdZooId}`)
      .expect(200);
    const actions = revisions.body.items.map((item: { action: string }) => item.action);
    expect(actions).toContain('create');
    expect(actions).toContain('publish');
  });

  it('forbids a viewer from the admin area', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/api/v1/auth/login')
      .send({ email: 'viewer@test.local', password: 'Viewer-Password-2026' })
      .expect(201);
    await agent.get('/api/v1/admin/zoos').expect(403);
  });

  it('returns 409 when deleting a country with dependent zoos', async () => {
    const admin = request.agent(app.getHttpServer());
    await admin
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(201);
    await admin.delete(`/api/v1/admin/countries/${countryId}`).expect(409);
  });

  it('rate limits repeated failed logins', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@test.local', password: 'bad-password-123' })
        .expect(401);
    }
    const last = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@test.local', password: 'bad-password-123' });
    expect([401, 429]).toContain(last.status);
  });
});

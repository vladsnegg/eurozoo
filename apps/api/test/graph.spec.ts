import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/bootstrap';

type GraphBody = {
  nodes: Array<{ type: string; id: string; label: string; degree: number }>;
  edges: Array<{ predicate: string; inferred: boolean }>;
  truncated: boolean;
  stats: { nodes: number; edges: number; depth: number };
};

describe('graph API', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();
  let zooId = '';
  let speciesId = '';
  let programId = '';

  beforeAll(async () => {
    app = await createApp();
    await app.init();

    const zoo = await request(app.getHttpServer()).get('/api/v1/zoos/zoo-praha').expect(200);
    zooId = zoo.body.id as string;

    const species = await request(app.getHttpServer())
      .get('/api/v1/species/panthera-tigris')
      .expect(200);
    speciesId = species.body.id as string;

    const program = await prisma.conservationProgram.findUniqueOrThrow({
      where: { slug: 'eep-panthera-tigris' },
    });
    programId = program.id;
  });

  afterAll(async () => {
    await prisma.zooProgram.deleteMany({ where: { zooId } });
    await prisma.$disconnect();
    await app.close();
  });

  it('builds a depth-1 subgraph with geography', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/graph?seed=zoo:${zooId}&depth=1`)
      .expect(200);
    const body = res.body as GraphBody;
    expect(body.stats.depth).toBe(1);
    expect(body.nodes.map((node) => node.type)).toContain('city');
    expect(body.edges.map((edge) => edge.predicate)).toContain('LOCATED_IN');
  });

  it('expands to country at depth 2 and filters node types', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/graph?seed=zoo:${zooId}&depth=2&types=zoo,city,country`)
      .expect(200);
    const body = res.body as GraphBody;
    const types = body.nodes.map((node) => node.type);
    expect(types).toContain('country');
    expect(types.every((type) => ['zoo', 'city', 'country'].includes(type))).toBe(true);
  });

  it('rejects unknown predicates', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/graph?seed=zoo:${zooId}&predicates=NOT_A_PREDICATE`)
      .expect(400);
    expect(res.body.type).toBe('validation_error');
  });

  it('returns 404 for a missing seed entity', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/graph?seed=zoo:00000000-0000-0000-0000-000000000000')
      .expect(404);
  });

  it('rejects a malformed seed', async () => {
    await request(app.getHttpServer()).get('/api/v1/graph?seed=nope').expect(400);
  });

  it('clamps the node limit and reports truncation', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/graph?seed=zoo:${zooId}&depth=2&limit=1`)
      .expect(200);
    const body = res.body as GraphBody;
    expect(body.nodes.length).toBeLessThanOrEqual(1);
    expect(body.truncated).toBe(true);
  });

  it('respects the inferred flag using the R3 view', async () => {
    await prisma.zooProgram.create({
      data: { zooId, programId, role: 'participant', sinceYear: 2020 },
    });

    try {
      const withoutInferred = await request(app.getHttpServer())
        .get(`/api/v1/graph?seed=zoo:${zooId}&depth=2&types=zoo,species`)
        .expect(200);
      const withoutBody = withoutInferred.body as GraphBody;
      expect(withoutBody.edges.some((edge) => edge.predicate === 'INFERRED_PROGRAM_SPECIES')).toBe(false);

      const withInferred = await request(app.getHttpServer())
        .get(`/api/v1/graph?seed=zoo:${zooId}&depth=2&types=zoo,species&inferred=true`)
        .expect(200);
      const withBody = withInferred.body as GraphBody;
      const inferredEdges = withBody.edges.filter(
        (edge) => edge.predicate === 'INFERRED_PROGRAM_SPECIES',
      );
      expect(inferredEdges.length).toBeGreaterThan(0);
      expect(inferredEdges[0]?.inferred).toBe(true);
    } finally {
      await prisma.zooProgram.deleteMany({ where: { zooId, programId } });
    }
  });

  it('lists predicates available in the graph', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/graph/predicates').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('code');
    expect(res.body[0]).toHaveProperty('labelRu');
  });

  it('traverses species taxonomy without cycles', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/graph?seed=species:${speciesId}&depth=3`)
      .expect(200);
    const body = res.body as GraphBody;
    expect(body.nodes.length).toBeGreaterThan(1);
    const ids = body.nodes.map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

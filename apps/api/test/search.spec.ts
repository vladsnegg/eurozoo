import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/bootstrap';

type SearchBody = {
  total: number;
  groups: Array<{ type: string; items: Array<{ title: string; type: string }> }>;
  suggestions: Array<{ title: string }>;
};

const CASES: Array<[string, string]> = [
  ['тигр', 'Panthera tigris'],
  ['Tiger', 'Panthera tigris'],
  ['панда', 'Ailuropoda melanoleuca'],
  ['малая панда', 'Ailurus fulgens'],
  ['слон', 'Loxodonta africana'],
  ['жираф', 'Giraffa camelopardalis'],
  ['Прага', 'Zoo Praha'],
  ['Вена', 'Tiergarten Schönbrunn'],
];

describe('search API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  for (const [query, expected] of CASES) {
    it(`ranks «${query}» to «${expected}»`, async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/search?q=${encodeURIComponent(query)}`)
        .expect(200);
      const body = res.body as SearchBody;
      expect(body.total).toBeGreaterThan(0);
      expect(body.groups.flatMap((group) => group.items.map((item) => item.title))).toContain(expected);
    });
  }

  it('finds species by family name', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/search?q=Felidae&types=species')
      .expect(200);
    const body = res.body as SearchBody;
    expect(body.total).toBeGreaterThanOrEqual(5);
    expect(body.groups[0]?.type).toBe('species');
  });

  it('finds organizations by acronym', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/search?q=EAZA&types=organization')
      .expect(200);
    const body = res.body as SearchBody;
    expect(
      body.groups.flatMap((group) => group.items.map((item) => item.title)),
    ).toContain('European Association of Zoos and Aquaria');
  });

  it('returns synonyms-aware results for a Russian common name', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/search?q=%D1%82%D0%B8%D0%B3%D1%80')
      .expect(200);
    expect((res.body as SearchBody).groups[0]?.items[0]?.title).toBe('Panthera tigris');
  });

  it('offers suggestions for a typo instead of failing', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/search?q=%D1%82%D0%B8%D0%B3%D1%80%D1%80')
      .expect(200);
    const body = res.body as SearchBody;
    expect(body.total).toBe(0);
    expect(body.suggestions.length).toBeGreaterThan(0);
  });

  it('applies the type facet filter', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/search?q=%D0%9F%D1%80%D0%B0%D0%B3%D0%B0&types=zoo')
      .expect(200);
    const body = res.body as SearchBody;
    expect(body.total).toBeGreaterThanOrEqual(1);
    expect(body.groups[0]?.type).toBe('zoo');
    expect(body.groups[0]?.items.map((item) => item.title)).toContain('Zoo Praha');
  });

  it('exposes published programmes and hides drafts in public search', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/search?q=EEP').expect(200);
    const body = res.body as SearchBody;
    expect(body.total).toBeGreaterThan(0);
    const items = body.groups.flatMap((group) => group.items);
    expect(items.some((item) => item.type === 'program')).toBe(true);
    expect(items.some((item) => item.title === 'EEP: Panthera tigris')).toBe(false);
  });

  it('rejects a missing query with 400', async () => {
    await request(app.getHttpServer()).get('/api/v1/search').expect(400);
  });

  it('does not fail on special characters', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/search?q=%22%26%7C%21%28%29%2A')
      .expect(200);
    expect(res.body.total).toBeTypeOf('number');
  });

  it('returns related knowledge groups for a zoo', async () => {
    const zoo = await request(app.getHttpServer()).get('/api/v1/zoos/zoo-praha').expect(200);
    const res = await request(app.getHttpServer())
      .get(`/api/v1/entities/zoo/${zoo.body.id}/related`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.map((group: { predicate: string }) => group.predicate)).toContain('LOCATED_IN');
  });

  it('returns lineage relations for a species', async () => {
    const species = await request(app.getHttpServer())
      .get('/api/v1/species/panthera-tigris')
      .expect(200);
    const res = await request(app.getHttpServer())
      .get(`/api/v1/entities/species/${species.body.id}/related`)
      .expect(200);
    expect(res.body.map((group: { predicate: string }) => group.predicate)).toContain('PART_OF');
  });
});

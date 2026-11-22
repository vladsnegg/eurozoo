import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/bootstrap';

describe('public read API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists published zoos with city and counts', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/zoos').expect(200);
    expect(res.body.total).toBeGreaterThanOrEqual(5);
    expect(res.body.items[0]).toMatchObject({
      slug: expect.any(String),
      name: expect.any(String),
      city: { name: expect.any(String), country: { iso2: expect.any(String) } },
    });
    expect(res.body.items[0].speciesCount).toBeTypeOf('number');
  });

  it('filters zoos by country and coordinates', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/zoos?country=czechia&hasCoords=true')
      .expect(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].slug).toBe('zoo-praha');
  });

  it('rejects unknown sort with 400', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/zoos?sort=bogus').expect(400);
    expect(res.body.type).toBe('validation_error');
    expect(res.body.requestId).toBeTruthy();
  });

  it('returns zoo detail with provenance', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/zoos/zoo-praha').expect(200);
    expect(res.body).toMatchObject({ slug: 'zoo-praha', status: 'active' });
    expect(res.body.city.country.iso2).toBe('CZ');
    expect(res.body.sources.length).toBeGreaterThanOrEqual(1);
    expect(res.body.provenance[0].verifiedAt).toBeTruthy();
  });

  it('returns species detail with full lineage', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/species/panthera-tigris')
      .expect(200);
    expect(res.body.scientificName).toBe('Panthera tigris');
    expect(res.body.iucn.code).toBe('EN');
    expect(res.body.lineage).toHaveLength(7);
    expect(res.body.lineage[0].scientificName).toBe('Animalia');
    expect(res.body.lineage.at(-1).slug).toBe('panthera-tigris');
  });

  it('filters species by family descendants', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/species?family=felidae')
      .expect(200);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(res.body.items.map((item: { slug: string }) => item.slug)).toContain('panthera-tigris');
  });

  it('returns country and city pages', async () => {
    const country = await request(app.getHttpServer())
      .get('/api/v1/countries/czechia')
      .expect(200);
    expect(country.body.iso2).toBe('CZ');
    expect(country.body.zoos).toHaveLength(1);

    const city = await request(app.getHttpServer()).get('/api/v1/cities/praha').expect(200);
    expect(city.body.country.slug).toBe('czechia');
    expect(city.body.zoos).toHaveLength(1);
  });

  it('returns 404 not_found for unknown slug', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/zoos/nope').expect(404);
    expect(res.body.type).toBe('not_found');
  });

  it('returns stats and highlights', async () => {
    const stats = await request(app.getHttpServer()).get('/api/v1/stats').expect(200);
    expect(stats.body.zoos).toBeGreaterThanOrEqual(30);
    expect(stats.body.species).toBeGreaterThanOrEqual(60);
    expect(stats.body.countries).toBeGreaterThanOrEqual(12);
    const highlights = await request(app.getHttpServer())
      .get('/api/v1/stats/highlights')
      .expect(200);
    expect(highlights.body.recent.length).toBeGreaterThan(0);
    expect(highlights.body.topCountries.length).toBeGreaterThan(0);
  });
});

import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/bootstrap';

describe('infrastructure endpoints', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health returns ok with database up', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'up' });
    expect(typeof res.body.version).toBe('string');
    expect(typeof res.body.uptimeSeconds).toBe('number');
    expect(res.headers['x-request-id']).toBeTruthy();
  });

  it('unknown route returns RFC 7807 payload', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/does-not-exist').expect(404);
    expect(res.body).toMatchObject({
      type: 'not_found',
      status: 404,
      instance: '/api/v1/does-not-exist',
    });
    expect(res.body.requestId).toBeTruthy();
  });
});

import 'reflect-metadata';
import { createApp } from './bootstrap';
import { env } from './config/env';

async function bootstrap(): Promise<void> {
  const app = await createApp();
  await app.listen(env.API_PORT);
  process.stdout.write(`API listening on http://localhost:${env.API_PORT}/api/v1\n`);
}

void bootstrap();

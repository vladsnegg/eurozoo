import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(__dirname, '../../../.env') });
const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_search_index');
  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT count(*)::int AS count FROM mv_search_index
  `;
  process.stdout.write(`Search index refreshed: ${rows[0]?.count ?? 0} documents\n`);
}

main()
  .catch((error: unknown) => {
    process.stderr.write(
      `Refresh failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

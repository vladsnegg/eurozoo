import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(__dirname, '../../../.env') });
const prisma = new PrismaClient();

async function main(): Promise<void> {
  const rows = await prisma.entitySource.findMany({
    where: {
      OR: [
        { staleAfter: { lt: new Date() } },
        { staleAfter: null, verifiedAt: { lt: new Date(Date.now() - 365 * 86400000) } },
      ],
    },
    include: { source: { select: { title: true, url: true } } },
    orderBy: { verifiedAt: 'asc' },
    take: 200,
  });

  if (rows.length === 0) {
    process.stdout.write('Просроченный провенанс отсутствует.\n');
    return;
  }

  for (const row of rows) {
    process.stdout.write(
      `${row.entityType}:${row.entityId} — ${row.source.title} — проверено ${
        row.verifiedAt?.toISOString().slice(0, 10) ?? 'никогда'
      }, истекает ${row.staleAfter?.toISOString().slice(0, 10) ?? 'никогда'}\n`,
    );
  }
  process.stdout.write(`Всего: ${rows.length}\n`);
}

main()
  .catch((error: unknown) => {
    process.stderr.write(`Stale report failed: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

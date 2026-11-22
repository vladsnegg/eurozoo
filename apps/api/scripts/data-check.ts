import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(__dirname, '../../../.env') });
const prisma = new PrismaClient();

type Check = { name: string; count: number; severity: 'error' | 'warning' };

async function main(): Promise<void> {
  const checks: Check[] = [];

  const speciesWithoutProfile = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT count(*)::int AS count
    FROM taxon t JOIN taxonomic_rank r ON r.id = t.rank_id AND r.code = 'species'
    LEFT JOIN species_profile sp ON sp.taxon_id = t.id
    WHERE sp.taxon_id IS NULL
  `;
  checks.push({
    name: 'виды без профиля',
    count: speciesWithoutProfile[0]?.count ?? 0,
    severity: 'error',
  });

  const cycles = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT count(*)::int AS count FROM v_taxon_lineage WHERE depth > 0 AND taxon_id = start_id
  `;
  checks.push({ name: 'циклы таксономии', count: cycles[0]?.count ?? 0, severity: 'error' });

  const publishedZoosWithoutSource = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT count(*)::int AS count FROM zoo z
    WHERE z.publish_status = 'published' AND NOT EXISTS (
      SELECT 1 FROM entity_source es
      WHERE es.entity_type = 'zoo' AND es.entity_id = z.id
        AND es.status = 'current' AND es.verified_at IS NOT NULL
    )
  `;
  checks.push({
    name: 'опубликованные зоопарки без проверенного источника',
    count: publishedZoosWithoutSource[0]?.count ?? 0,
    severity: 'error',
  });

  const orphanEdges = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT count(*)::int AS count
    FROM knowledge_edge e
    WHERE NOT (
      (e.src_type = 'zoo' AND EXISTS (SELECT 1 FROM zoo x WHERE x.id = e.src_id)) OR
      (e.src_type = 'species' AND EXISTS (SELECT 1 FROM taxon x WHERE x.id = e.src_id)) OR
      (e.src_type = 'taxon' AND EXISTS (SELECT 1 FROM taxon x WHERE x.id = e.src_id)) OR
      (e.src_type = 'country' AND EXISTS (SELECT 1 FROM country x WHERE x.id = e.src_id)) OR
      (e.src_type = 'city' AND EXISTS (SELECT 1 FROM city x WHERE x.id = e.src_id)) OR
      (e.src_type = 'program' AND EXISTS (SELECT 1 FROM conservation_program x WHERE x.id = e.src_id)) OR
      (e.src_type = 'organization' AND EXISTS (SELECT 1 FROM organization x WHERE x.id = e.src_id)) OR
      (e.src_type = 'research' AND EXISTS (SELECT 1 FROM research_project x WHERE x.id = e.src_id)) OR
      (e.src_type = 'education' AND EXISTS (SELECT 1 FROM education_program x WHERE x.id = e.src_id))
    ) OR NOT (
      (e.dst_type = 'zoo' AND EXISTS (SELECT 1 FROM zoo x WHERE x.id = e.dst_id)) OR
      (e.dst_type = 'species' AND EXISTS (SELECT 1 FROM taxon x WHERE x.id = e.dst_id)) OR
      (e.dst_type = 'taxon' AND EXISTS (SELECT 1 FROM taxon x WHERE x.id = e.dst_id)) OR
      (e.dst_type = 'country' AND EXISTS (SELECT 1 FROM country x WHERE x.id = e.dst_id)) OR
      (e.dst_type = 'city' AND EXISTS (SELECT 1 FROM city x WHERE x.id = e.dst_id)) OR
      (e.dst_type = 'program' AND EXISTS (SELECT 1 FROM conservation_program x WHERE x.id = e.dst_id)) OR
      (e.dst_type = 'organization' AND EXISTS (SELECT 1 FROM organization x WHERE x.id = e.dst_id)) OR
      (e.dst_type = 'research' AND EXISTS (SELECT 1 FROM research_project x WHERE x.id = e.dst_id)) OR
      (e.dst_type = 'education' AND EXISTS (SELECT 1 FROM education_program x WHERE x.id = e.dst_id))
    )
  `;
  checks.push({ name: 'рёбра-сироты', count: orphanEdges[0]?.count ?? 0, severity: 'error' });

  const publishedWithoutSource = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT count(*)::int AS count FROM (
      SELECT z.id FROM zoo z WHERE z.publish_status = 'published' AND NOT EXISTS (
        SELECT 1 FROM entity_source es WHERE es.entity_type = 'zoo' AND es.entity_id = z.id
          AND es.status = 'current' AND es.verified_at IS NOT NULL)
      UNION ALL
      SELECT t.id FROM taxon t JOIN taxonomic_rank r ON r.id = t.rank_id AND r.code = 'species'
      WHERE t.publish_status = 'published' AND NOT EXISTS (
        SELECT 1 FROM entity_source es WHERE es.entity_type = 'species' AND es.entity_id = t.id
          AND es.status = 'current' AND es.verified_at IS NOT NULL)
      UNION ALL
      SELECT p.id FROM conservation_program p WHERE p.publish_status = 'published' AND NOT EXISTS (
        SELECT 1 FROM entity_source es WHERE es.entity_type = 'program' AND es.entity_id = p.id
          AND es.status = 'current' AND es.verified_at IS NOT NULL)
      UNION ALL
      SELECT o.id FROM organization o WHERE o.publish_status = 'published' AND NOT EXISTS (
        SELECT 1 FROM entity_source es WHERE es.entity_type = 'organization' AND es.entity_id = o.id
          AND es.status = 'current' AND es.verified_at IS NOT NULL)
      UNION ALL
      SELECT r.id FROM research_project r WHERE r.publish_status = 'published' AND NOT EXISTS (
        SELECT 1 FROM entity_source es WHERE es.entity_type = 'research' AND es.entity_id = r.id
          AND es.status = 'current' AND es.verified_at IS NOT NULL)
    ) missing
  `;
  checks.push({
    name: 'опубликованные объекты без проверенного источника',
    count: publishedWithoutSource[0]?.count ?? 0,
    severity: 'error',
  });

  const minimums: Array<[string, number, number]> = [
    ['страны', await prisma.country.count(), 12],
    ['города', await prisma.city.count(), 25],
    ['зоопарки', await prisma.zoo.count(), 30],
    ['виды с профилем', await prisma.speciesProfile.count(), 60],
    ['организации', await prisma.organization.count(), 10],
    ['программы', await prisma.conservationProgram.count(), 15],
    ['исследования', await prisma.researchProject.count(), 8],
    ['образовательные программы', await prisma.educationProgram.count(), 20],
    ['источники', await prisma.source.count(), 80],
    ['содержание видов', await prisma.zooSpecies.count(), 150],
    ['участие в программах', await prisma.zooProgram.count(), 60],
    ['связи графа', await prisma.knowledgeEdge.count(), 40],
  ];
  for (const [name, value, minimum] of minimums) {
    checks.push({ name: `покрытие: ${name} (${value}/${minimum})`, count: value < minimum ? 1 : 0, severity: 'error' });
  }

  const stale = await prisma.entitySource.count({
    where: { staleAfter: { lt: new Date() } },
  });
  checks.push({ name: 'просроченный провенанс', count: stale, severity: 'warning' });

  let failed = false;
  for (const check of checks) {
    const mark = check.count === 0 ? 'ok' : check.severity === 'error' ? 'FAIL' : 'warn';
    process.stdout.write(`[${mark}] ${check.name}: ${check.count}\n`);
    if (check.count > 0 && check.severity === 'error') failed = true;
  }

  if (failed) process.exitCode = 1;
}

main()
  .catch((error: unknown) => {
    process.stderr.write(
      `Check failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

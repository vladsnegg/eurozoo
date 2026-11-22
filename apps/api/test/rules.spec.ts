import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const prisma = new PrismaClient();

describe('knowledge rules R1-R6', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('R1: geography view resolves zoo -> city -> country', async () => {
    const rows = await prisma.$queryRaw<
      Array<{ country_slug: string; city_slug: string }>
    >`SELECT country_slug, city_slug FROM v_zoo_geo WHERE zoo_slug = 'zoo-praha'`;
    expect(rows).toHaveLength(1);
    expect(rows[0]?.country_slug).toBe('czechia');
  });

  it('R2: lineage depth for species equals ancestors + self', async () => {
    const rows = await prisma.$queryRaw<Array<{ depth: number }>>`
      SELECT max(depth)::int AS depth FROM v_taxon_lineage
      WHERE start_id = (SELECT id FROM taxon WHERE slug = 'panthera-tigris')
    `;
    expect(rows[0]?.depth).toBe(6);
  });

  it('R3: program membership yields inferred zoo-species relation', async () => {
    const zoo = await prisma.zoo.findUniqueOrThrow({ where: { slug: 'zoo-praha' } });
    const taxon = await prisma.taxon.findUniqueOrThrow({ where: { slug: 'panthera-tigris' } });
    const program = await prisma.conservationProgram.findUniqueOrThrow({
      where: { slug: 'eep-panthera-tigris' },
    });

    await prisma.zooProgram.create({
      data: { zooId: zoo.id, programId: program.id, role: 'participant', sinceYear: 2020 },
    });

    try {
      const rows = await prisma.$queryRaw<
        Array<{ zoo_id: string; taxon_id: string; program_id: string }>
      >`
        SELECT zoo_id, taxon_id, program_id FROM v_zoo_program_species
        WHERE zoo_id = ${zoo.id}::uuid AND taxon_id = ${taxon.id}::uuid
      `;
      expect(rows).toHaveLength(1);
      expect(rows[0]?.program_id).toBe(program.id);
    } finally {
      await prisma.zooProgram.delete({
        where: { zooId_programId: { zooId: zoo.id, programId: program.id } },
      });
    }
  });

  it('R5: zoos sharing species are related', async () => {
    const [praha, artis] = await Promise.all([
      prisma.zoo.findUniqueOrThrow({ where: { slug: 'zoo-praha' } }),
      prisma.zoo.findUniqueOrThrow({ where: { slug: 'artis-amsterdam' } }),
    ]);

    const rows = await prisma.$queryRaw<Array<{ score: number }>>`
      SELECT score FROM v_related_zoos
      WHERE (zoo_a = ${praha.id}::uuid AND zoo_b = ${artis.id}::uuid)
         OR (zoo_a = ${artis.id}::uuid AND zoo_b = ${praha.id}::uuid)
    `;
    expect(rows).toHaveLength(1);
    expect(Number(rows[0]?.score)).toBeGreaterThan(0);
    expect(Number(rows[0]?.score)).toBeLessThanOrEqual(1);
  });

  it('rejects invalid coordinates at database level', async () => {
    const city = await prisma.city.findUniqueOrThrow({ where: { slug: 'praha' } });
    const country = await prisma.country.findUniqueOrThrow({ where: { iso2: 'CZ' } });

    await expect(
      prisma.city.create({
        data: { name: 'Test city', slug: 'test-invalid-coords', countryId: country.id, lat: 99, lng: 0 },
      }),
    ).rejects.toThrow();

    expect(city.lat).toBeGreaterThan(34);
  });
});

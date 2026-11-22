import { PrismaClient, type EntityType, type Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { argon2id } from 'hash-wasm';
import { config } from 'dotenv';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

config({ path: resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

const DEFAULT_VERIFIED_AT = '2026-11-19';

type IucnSeed = { id: number; code: string; nameRu: string; severity: number; color: string };
type RankSeed = { id: number; code: string; nameRu: string; level: number };
type CountrySeed = {
  iso2: string;
  iso3: string;
  name: string;
  nameLocal: string;
  slug: string;
  euMember: boolean;
};
type CitySeed = { countryIso2: string; name: string; slug: string; lat: number; lng: number };
type SourceSeed = {
  id: string;
  type: string;
  title: string;
  url: string;
  publisher?: string | null;
  publishedAt?: string | null;
  license?: string | null;
  reliability: string;
  accessedAt: string;
};
type ZooSeed = {
  slug: string;
  name: string;
  nameLocal?: string | null;
  citySlug: string;
  countryIso2: string;
  foundedYear?: number | null;
  areaHa?: number | null;
  annualVisitors?: number | null;
  lat?: number | null;
  lng?: number | null;
  website?: string | null;
  description?: string | null;
  locationLabel?: string | null;
  status?: string;
  publishStatus?: string;
  sourceUrl?: string;
  sourceRefs?: string[];
  coordSourceRef?: string;
  verifiedAt?: string;
};
type ZooNewsSeed = {
  zooSlug: string;
  title: string;
  summary?: string | null;
  url: string;
  sourceName?: string | null;
  publishedAt: string;
  publishStatus?: string;
  verifiedAt?: string;
};
type HabitatSeed = { slug: string; name: string; biome: string; description: string };
type TaxonSeed = {
  scientificName: string;
  slug: string;
  rankCode: string;
  parentScientificName?: string;
  commonNameRu?: string;
  commonNameEn?: string;
  authority?: string;
  yearDescribed?: number;
  iucnCode?: string;
  habitatSlugs?: string[];
  gbifKey?: string | number;
  imageUrl?: string;
  imageCredit?: string;
  imageCreditUrl?: string;
  publishStatus?: string;
  sourceRefs?: string[];
  iucnSourceRef?: string;
  verifiedAt?: string;
  profile?: {
    populationTrend?: string;
    habitatSummary?: string;
    dietSummary?: string;
    lifespanYears?: number;
    weightKgMin?: number;
    weightKgMax?: number;
    lengthCmMin?: number;
    lengthCmMax?: number;
    description?: string;
  };
};
type OrgSeed = {
  slug: string;
  name: string;
  acronym?: string | null;
  type: string;
  countrySlug?: string;
  foundedYear?: number | null;
  website?: string | null;
  description?: string | null;
  publishStatus?: string;
  sourceRefs?: string[];
  verifiedAt?: string;
};
type ProgramSeed = {
  slug: string;
  name: string;
  code: string;
  organizationSlug?: string | null;
  startedYear?: number | null;
  endedYear?: number | null;
  status: string;
  publishStatus?: string;
  description: string;
  targetSpecies: string[];
  sourceRefs?: string[];
  verifiedAt?: string;
};
type ResearchSeed = {
  slug: string;
  title: string;
  summary?: string | null;
  startedYear?: number | null;
  endedYear?: number | null;
  status: string;
  publishStatus?: string;
  leadOrganizationSlug?: string | null;
  zooSlugs?: string[];
  speciesScientificNames?: string[];
  sourceRefs?: string[];
  verifiedAt?: string;
};
type EducationSeed = {
  zooSlug: string;
  title: string;
  audience: string;
  format: string;
  description?: string | null;
  url?: string | null;
  sourceRefs?: string[];
  verifiedAt?: string;
};
type ZooSpeciesSeed = {
  zooSlug: string;
  scientificName: string;
  countMale?: number | null;
  countFemale?: number | null;
  countUnsexed?: number | null;
  sinceYear?: number | null;
  breeding?: boolean;
  note?: string | null;
  sourceRefs: string[];
  verifiedAt?: string;
};
type ZooProgramSeed = {
  zooSlug: string;
  programSlug: string;
  role?: string;
  sinceYear?: number | null;
  untilYear?: number | null;
  sourceRefs: string[];
  verifiedAt?: string;
};
type ZooOrganizationSeed = {
  zooSlug: string;
  organizationSlug: string;
  role?: string | null;
  sinceYear?: number | null;
  untilYear?: number | null;
  sourceRefs: string[];
  verifiedAt?: string;
};
type EdgeSeed = {
  srcType: string;
  srcRef: string;
  predicate: string;
  dstType: string;
  dstRef: string;
  confidence?: number | null;
  note?: string | null;
  sourceRefs: string[];
};
type SynonymSeed = { term: string; synonym: string };
type PredicateSeed = {
  code: string;
  labelRu: string;
  domainType: string;
  rangeType: string;
  cardinality: string;
  isTransitive: boolean;
  isInferred: boolean;
  description: string;
};

async function seedAdmin(): Promise<void> {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!email || !password) return;

  const existing = await prisma.appUser.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return;

  const passwordHash = await argon2id({
    password,
    salt: randomBytes(16),
    parallelism: 1,
    iterations: 2,
    memorySize: 19456,
    hashLength: 32,
    outputType: 'encoded',
  });

  await prisma.appUser.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      displayName: 'Администратор',
      role: 'admin',
    },
  });
  process.stdout.write(`Bootstrap admin created: ${email.toLowerCase()}\n`);
}

function load<T>(file: string): T {
  return JSON.parse(readFileSync(resolve(__dirname, 'seeds', file), 'utf8')) as T;
}

function warned(message: string): void {
  process.stderr.write(`warning: ${message}\n`);
}

async function main(): Promise<void> {
  const iucn = load<IucnSeed[]>('iucn.json');
  const ranks = load<RankSeed[]>('ranks.json');
  const countries = load<CountrySeed[]>('countries.json');
  const cities = load<CitySeed[]>('cities.json');
  const zoos = load<ZooSeed[]>('zoos.json');
  const zooNews = load<ZooNewsSeed[]>('zoo-news.json');
  const habitats = load<HabitatSeed[]>('habitats.json');
  const taxa = load<TaxonSeed[]>('taxa.json');
  const organizations = load<OrgSeed[]>('organizations.json');
  const programs = load<ProgramSeed[]>('programs.json');
  const research = load<ResearchSeed[]>('research.json');
  const education = load<EducationSeed[]>('education.json');
  const zooSpecies = load<ZooSpeciesSeed[]>('zoo-species.json');
  const zooPrograms = load<ZooProgramSeed[]>('zoo-programs.json');
  const zooOrganizations = load<ZooOrganizationSeed[]>('zoo-organizations.json');
  const edges = load<EdgeSeed[]>('edges.json');
  const sources = load<SourceSeed[]>('sources.json');
  const predicates = load<PredicateSeed[]>('predicates.json');
  const synonyms = load<SynonymSeed[]>('synonyms.json');

  for (const item of iucn) {
    await prisma.iucnStatus.upsert({
      where: { id: item.id },
      update: { code: item.code, nameRu: item.nameRu, severity: item.severity, color: item.color },
      create: item,
    });
  }

  for (const item of ranks) {
    await prisma.taxonomicRank.upsert({
      where: { id: item.id },
      update: { code: item.code, nameRu: item.nameRu, level: item.level },
      create: item,
    });
  }

  // Предикаты нужны до создания рёбер графа.
  for (const item of predicates) {
    const data = {
      labelRu: item.labelRu,
      domainType: item.domainType as Prisma.PredicateCreateInput['domainType'],
      rangeType: item.rangeType as Prisma.PredicateCreateInput['rangeType'],
      cardinality: item.cardinality,
      isTransitive: item.isTransitive,
      isInferred: item.isInferred,
      description: item.description,
    };
    await prisma.predicate.upsert({
      where: { code: item.code },
      update: data,
      create: { code: item.code, ...data },
    });
  }

  const countryByIso = new Map<string, string>();
  const countryBySlug = new Map<string, string>();
  for (const item of countries) {
    const row = await prisma.country.upsert({
      where: { iso2: item.iso2 },
      update: {
        name: item.name,
        nameLocal: item.nameLocal,
        slug: item.slug,
        euMember: item.euMember,
      },
      create: item,
    });
    countryByIso.set(item.iso2, row.id);
    countryBySlug.set(item.slug, row.id);
  }

  const cityBySlug = new Map<string, string>();
  for (const item of cities) {
    const countryId = countryByIso.get(item.countryIso2);
    if (!countryId) throw new Error(`Unknown country ${item.countryIso2}`);
    const row = await prisma.city.upsert({
      where: { countryId_slug: { countryId, slug: item.slug } },
      update: { name: item.name, lat: item.lat, lng: item.lng },
      create: { countryId, name: item.name, slug: item.slug, lat: item.lat, lng: item.lng },
    });
    cityBySlug.set(item.slug, row.id);
  }

  const habitatBySlug = new Map<string, string>();
  for (const item of habitats) {
    const row = await prisma.habitat.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        biome: item.biome as Prisma.HabitatCreateInput['biome'],
      },
      create: {
        slug: item.slug,
        name: item.name,
        biome: item.biome as Prisma.HabitatCreateInput['biome'],
        description: item.description,
      },
    });
    habitatBySlug.set(item.slug, row.id);
  }

  const sourceById = new Map<string, { id: string; accessedAt: Date; url: string }>();
  const sourceByUrl = new Map<string, { id: string; accessedAt: Date; url: string }>();
  const sourceMetaById = new Map<string, { accessedAt: Date }>();
  for (const item of sources) {
    const accessedAt = new Date(item.accessedAt);
    const row = await prisma.source.upsert({
      where: { url: item.url },
      update: {
        title: item.title,
        publisher: item.publisher ?? null,
        type: item.type as Prisma.SourceCreateInput['type'],
        reliability: item.reliability as Prisma.SourceCreateInput['reliability'],
        accessedAt,
        publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
        license: item.license ?? null,
      },
      create: {
        type: item.type as Prisma.SourceCreateInput['type'],
        title: item.title,
        url: item.url,
        publisher: item.publisher ?? null,
        accessedAt,
        publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
        license: item.license ?? null,
        reliability: item.reliability as Prisma.SourceCreateInput['reliability'],
      },
    });
    sourceById.set(item.id, { id: row.id, accessedAt, url: row.url });
    sourceByUrl.set(item.url, { id: row.id, accessedAt, url: row.url });
    sourceMetaById.set(row.id, { accessedAt });
  }

  function resolveSources(refs: string[] | undefined, fallbackUrl?: string | null): string[] {
    const ids: string[] = [];
    for (const ref of refs ?? []) {
      const source = sourceById.get(ref) ?? sourceByUrl.get(ref);
      if (!source) throw new Error(`Unknown source ref ${ref}`);
      ids.push(source.id);
    }
    if (ids.length === 0 && fallbackUrl) {
      const source = sourceByUrl.get(fallbackUrl);
      if (source) ids.push(source.id);
    }
    return ids;
  }

  async function linkSources(
    entityType: EntityType,
    entityId: string,
    sourceIds: string[],
    fieldName = '',
    verifiedAt = DEFAULT_VERIFIED_AT,
    confidence = 1,
  ): Promise<void> {
    const verified = new Date(verifiedAt);
    const staleAfter = new Date(verified);
    staleAfter.setUTCFullYear(staleAfter.getUTCFullYear() + 1);
    for (const sourceId of sourceIds) {
      const retrievedAt = sourceMetaById.get(sourceId)?.accessedAt ?? verified;
      await prisma.entitySource.upsert({
        where: {
          entityType_entityId_sourceId_fieldName: {
            entityType,
            entityId,
            sourceId,
            fieldName,
          },
        },
        update: { verifiedAt: verified, retrievedAt, staleAfter, status: 'current', confidence },
        create: {
          entityType,
          entityId,
          sourceId,
          fieldName,
          confidence,
          retrievedAt,
          verifiedAt: verified,
          staleAfter,
          status: 'current',
        },
      });
    }
  }

  const zooBySlug = new Map<string, string>();
  const zooSourceById = new Map<string, string>();
  const zooCityById = new Map<string, string>();
  for (const item of zoos) {
    const cityId = cityBySlug.get(item.citySlug);
    if (!cityId) throw new Error(`Unknown city ${item.citySlug}`);
    const publishStatus = (item.publishStatus ??
      'published') as Prisma.ZooCreateInput['publishStatus'];
    const data = {
      name: item.name,
      nameLocal: item.nameLocal ?? null,
      cityId,
      foundedYear: item.foundedYear ?? null,
      areaHa: item.areaHa ?? null,
      annualVisitors: item.annualVisitors ?? null,
      lat: item.lat ?? null,
      lng: item.lng ?? null,
      website: item.website ?? null,
      description: item.description ?? null,
      locationLabel: item.locationLabel ?? null,
      status: (item.status ?? 'active') as Prisma.ZooCreateInput['status'],
      publishStatus,
    };
    const zoo = await prisma.zoo.upsert({
      where: { slug: item.slug },
      update: data,
      create: { slug: item.slug, ...data },
    });
    zooBySlug.set(item.slug, zoo.id);
    zooCityById.set(zoo.id, cityId);
    const refs = resolveSources(item.sourceRefs, item.sourceUrl);
    if (refs[0]) zooSourceById.set(zoo.id, refs[0]);
    await linkSources('zoo', zoo.id, refs, '', item.verifiedAt ?? DEFAULT_VERIFIED_AT);
    if (item.coordSourceRef) {
      const coordRefs = resolveSources([item.coordSourceRef]);
      await linkSources(
        'zoo',
        zoo.id,
        coordRefs,
        'coordinates',
        item.verifiedAt ?? DEFAULT_VERIFIED_AT,
        0.9,
      );
    }
    if (refs.length === 0) warned(`zoo ${item.slug} has no source`);
  }

  for (const item of zooNews) {
    const zooId = zooBySlug.get(item.zooSlug);
    if (!zooId) throw new Error(`Unknown zoo ${item.zooSlug}`);
    const data = {
      zooId,
      title: item.title,
      summary: item.summary ?? null,
      url: item.url,
      sourceName: item.sourceName ?? null,
      publishedAt: new Date(item.publishedAt),
      publishStatus: (item.publishStatus ??
        'published') as Prisma.ZooNewsCreateInput['publishStatus'],
      verifiedAt: item.verifiedAt ? new Date(item.verifiedAt) : null,
    };
    const existing = await prisma.zooNews.findFirst({ where: { zooId, url: item.url } });
    if (existing) {
      await prisma.zooNews.update({ where: { id: existing.id }, data });
    } else {
      await prisma.zooNews.create({ data });
    }
  }

  const taxonByName = new Map<string, string>();
  const iucnByCode = new Map(iucn.map((i) => [i.code, i.id]));
  const rankByCode = new Map(ranks.map((r) => [r.code, r.id]));
  const iucnSourceId = sourceByUrl.get('https://www.iucnredlist.org');

  for (const item of taxa) {
    const rankId = rankByCode.get(item.rankCode);
    if (!rankId) throw new Error(`Unknown rank ${item.rankCode}`);
    const parentId = item.parentScientificName ? taxonByName.get(item.parentScientificName) : null;
    if (item.parentScientificName && !parentId) {
      throw new Error(`Unknown parent ${item.parentScientificName}`);
    }

    const data = {
      slug: item.slug,
      rankId,
      parentId,
      commonNameRu: item.commonNameRu ?? null,
      commonNameEn: item.commonNameEn ?? null,
      authority: item.authority ?? null,
      yearDescribed: item.yearDescribed ?? null,
      gbifKey: item.gbifKey === undefined || item.gbifKey === null ? null : BigInt(item.gbifKey),
      imageUrl: item.imageUrl ?? null,
      imageCredit: item.imageCredit ?? null,
      imageCreditUrl: item.imageCreditUrl ?? null,
      publishStatus: (item.publishStatus ??
        'published') as Prisma.TaxonCreateInput['publishStatus'],
    };
    const taxon = await prisma.taxon.upsert({
      where: { scientificName: item.scientificName },
      update: data,
      create: { scientificName: item.scientificName, ...data },
    });
    taxonByName.set(item.scientificName, taxon.id);

    if (item.profile) {
      const profile = {
        iucnStatusId: item.iucnCode ? (iucnByCode.get(item.iucnCode) ?? null) : null,
        populationTrend: item.profile.populationTrend
          ? (item.profile.populationTrend as Prisma.SpeciesProfileCreateInput['populationTrend'])
          : null,
        habitatSummary: item.profile.habitatSummary ?? null,
        dietSummary: item.profile.dietSummary ?? null,
        lifespanYears: item.profile.lifespanYears ?? null,
        weightKgMin: item.profile.weightKgMin ?? null,
        weightKgMax: item.profile.weightKgMax ?? null,
        lengthCmMin: item.profile.lengthCmMin ?? null,
        lengthCmMax: item.profile.lengthCmMax ?? null,
        description: item.profile.description ?? null,
      };
      await prisma.speciesProfile.upsert({
        where: { taxonId: taxon.id },
        update: profile,
        create: { taxonId: taxon.id, ...profile },
      });
    }

    for (const habitatSlug of item.habitatSlugs ?? []) {
      const habitatId = habitatBySlug.get(habitatSlug);
      if (!habitatId) throw new Error(`Unknown habitat ${habitatSlug}`);
      await prisma.speciesHabitat.upsert({
        where: { taxonId_habitatId: { taxonId: taxon.id, habitatId } },
        update: {},
        create: { taxonId: taxon.id, habitatId },
      });
    }

    const taxonRefs = resolveSources(item.sourceRefs);
    await linkSources(
      'species',
      taxon.id,
      taxonRefs,
      'taxonomy',
      item.verifiedAt ?? DEFAULT_VERIFIED_AT,
    );
    const iucnRefs = item.iucnSourceRef
      ? resolveSources([item.iucnSourceRef])
      : item.iucnCode && iucnSourceId
        ? [iucnSourceId.id]
        : [];
    await linkSources(
      'species',
      taxon.id,
      iucnRefs,
      'iucn_status_id',
      item.verifiedAt ?? DEFAULT_VERIFIED_AT,
      0.9,
    );
  }

  const orgBySlug = new Map<string, string>();
  const orgSourceById = new Map<string, string>();
  for (const item of organizations) {
    const countryId = item.countrySlug ? (countryBySlug.get(item.countrySlug) ?? null) : null;
    const data = {
      name: item.name,
      acronym: item.acronym ?? null,
      type: item.type as Prisma.OrganizationCreateInput['type'],
      countryId,
      foundedYear: item.foundedYear ?? null,
      website: item.website ?? null,
      description: item.description ?? null,
      publishStatus: (item.publishStatus ??
        'published') as Prisma.OrganizationCreateInput['publishStatus'],
    };
    const row = await prisma.organization.upsert({
      where: { slug: item.slug },
      update: data,
      create: { slug: item.slug, ...data },
    });
    orgBySlug.set(item.slug, row.id);
    const refs = resolveSources(item.sourceRefs);
    if (refs[0]) orgSourceById.set(row.id, refs[0]);
    await linkSources('organization', row.id, refs, '', item.verifiedAt ?? DEFAULT_VERIFIED_AT);
    if (refs.length === 0) warned(`organization ${item.slug} has no source`);
  }

  const programBySlug = new Map<string, string>();
  const programSourceById = new Map<string, string>();
  const programSourceId = sourceByUrl.get('https://www.eaza.net');
  for (const item of programs) {
    const organizationId = item.organizationSlug
      ? (orgBySlug.get(item.organizationSlug) ?? null)
      : null;
    const data = {
      name: item.name,
      code: item.code as Prisma.ConservationProgramCreateInput['code'],
      organizationId,
      startedYear: item.startedYear ?? null,
      endedYear: item.endedYear ?? null,
      status: item.status as Prisma.ConservationProgramCreateInput['status'],
      description: item.description,
      publishStatus: (item.publishStatus ??
        'draft') as Prisma.ConservationProgramCreateInput['publishStatus'],
    };
    const row = await prisma.conservationProgram.upsert({
      where: { slug: item.slug },
      update: data,
      create: { slug: item.slug, ...data },
    });
    programBySlug.set(item.slug, row.id);

    for (const speciesName of item.targetSpecies) {
      const taxonId = taxonByName.get(speciesName);
      if (!taxonId) throw new Error(`Unknown species ${speciesName}`);
      await prisma.programSpecies.upsert({
        where: { programId_taxonId: { programId: row.id, taxonId } },
        update: {},
        create: { programId: row.id, taxonId, role: 'target' },
      });
    }

    const refs = resolveSources(
      item.sourceRefs?.length ? item.sourceRefs : undefined,
      item.sourceRefs?.length ? undefined : programSourceId?.url,
    );
    if (refs[0]) programSourceById.set(row.id, refs[0]);
    await linkSources('program', row.id, refs, '', item.verifiedAt ?? DEFAULT_VERIFIED_AT, 0.8);
  }

  const researchBySlug = new Map<string, string>();
  const researchSourceById = new Map<string, string>();
  for (const item of research) {
    const leadOrganizationId = item.leadOrganizationSlug
      ? (orgBySlug.get(item.leadOrganizationSlug) ?? null)
      : null;
    const data = {
      title: item.title,
      summary: item.summary ?? null,
      startedYear: item.startedYear ?? null,
      endedYear: item.endedYear ?? null,
      status: item.status as Prisma.ResearchProjectCreateInput['status'],
      publishStatus: (item.publishStatus ??
        'draft') as Prisma.ResearchProjectCreateInput['publishStatus'],
      leadOrganizationId,
    };
    const row = await prisma.researchProject.upsert({
      where: { slug: item.slug },
      update: data,
      create: { slug: item.slug, ...data },
    });
    researchBySlug.set(item.slug, row.id);

    for (const zooSlug of item.zooSlugs ?? []) {
      const zooId = zooBySlug.get(zooSlug);
      if (!zooId) throw new Error(`Unknown zoo ${zooSlug}`);
      await prisma.zooResearch.upsert({
        where: { zooId_researchId: { zooId, researchId: row.id } },
        update: {},
        create: { zooId, researchId: row.id },
      });
    }
    for (const name of item.speciesScientificNames ?? []) {
      const taxonId = taxonByName.get(name);
      if (!taxonId) throw new Error(`Unknown species ${name}`);
      await prisma.researchSpecies.upsert({
        where: { researchId_taxonId: { researchId: row.id, taxonId } },
        update: {},
        create: { researchId: row.id, taxonId },
      });
    }
    const refs = resolveSources(item.sourceRefs);
    if (refs[0]) researchSourceById.set(row.id, refs[0]);
    await linkSources('research', row.id, refs, '', item.verifiedAt ?? DEFAULT_VERIFIED_AT);
  }

  const educationSourceById = new Map<string, string>();

  for (const item of education) {
    const zooId = zooBySlug.get(item.zooSlug);
    if (!zooId) throw new Error(`Unknown zoo ${item.zooSlug}`);
    const data = {
      title: item.title,
      audience: item.audience as Prisma.EducationProgramCreateInput['audience'],
      format: item.format as Prisma.EducationProgramCreateInput['format'],
      description: item.description ?? null,
      url: item.url ?? null,
    };
    const existing = await prisma.educationProgram.findFirst({
      where: { zooId, title: item.title, format: data.format },
    });
    const row = existing
      ? await prisma.educationProgram.update({ where: { id: existing.id }, data })
      : await prisma.educationProgram.create({ data: { zooId, ...data } });
    const refs = resolveSources(item.sourceRefs);
    if (refs[0]) educationSourceById.set(row.id, refs[0]);
    await linkSources('education', row.id, refs, '', item.verifiedAt ?? DEFAULT_VERIFIED_AT);
  }

  let linkedSpecies = 0;
  for (const item of zooSpecies) {
    const zooId = zooBySlug.get(item.zooSlug);
    if (!zooId) throw new Error(`Unknown zoo ${item.zooSlug}`);
    const taxonId = taxonByName.get(item.scientificName);
    if (!taxonId) throw new Error(`Unknown species ${item.scientificName}`);
    const data = {
      countMale: item.countMale ?? null,
      countFemale: item.countFemale ?? null,
      countUnsexed: item.countUnsexed ?? null,
      sinceYear: item.sinceYear ?? null,
      breeding: item.breeding ?? false,
      note: item.note ?? null,
    };
    await prisma.zooSpecies.upsert({
      where: { zooId_taxonId: { zooId, taxonId } },
      update: data,
      create: { zooId, taxonId, ...data },
    });
    await linkSources(
      'zoo',
      zooId,
      resolveSources(item.sourceRefs),
      `zoo_species:${item.scientificName}`,
      item.verifiedAt ?? DEFAULT_VERIFIED_AT,
      0.9,
    );
    linkedSpecies += 1;
  }

  let linkedPrograms = 0;
  for (const item of zooPrograms) {
    const zooId = zooBySlug.get(item.zooSlug);
    if (!zooId) throw new Error(`Unknown zoo ${item.zooSlug}`);
    const programId = programBySlug.get(item.programSlug);
    if (!programId) throw new Error(`Unknown program ${item.programSlug}`);
    const data = {
      role: (item.role ?? 'participant') as Prisma.ZooProgramCreateInput['role'],
      sinceYear: item.sinceYear ?? null,
      untilYear: item.untilYear ?? null,
    };
    await prisma.zooProgram.upsert({
      where: { zooId_programId: { zooId, programId } },
      update: data,
      create: { zooId, programId, ...data },
    });
    await linkSources(
      'zoo',
      zooId,
      resolveSources(item.sourceRefs),
      `zoo_program:${item.programSlug}`,
      item.verifiedAt ?? DEFAULT_VERIFIED_AT,
      0.8,
    );
    linkedPrograms += 1;
  }

  let linkedOrganizations = 0;
  for (const item of zooOrganizations) {
    const zooId = zooBySlug.get(item.zooSlug);
    if (!zooId) throw new Error(`Unknown zoo ${item.zooSlug}`);
    const organizationId = orgBySlug.get(item.organizationSlug);
    if (!organizationId) throw new Error(`Unknown organization ${item.organizationSlug}`);
    const data = {
      role: item.role ?? null,
      sinceYear: item.sinceYear ?? null,
      untilYear: item.untilYear ?? null,
    };
    await prisma.zooOrganization.upsert({
      where: { zooId_organizationId: { zooId, organizationId } },
      update: data,
      create: { zooId, organizationId, ...data },
    });
    await linkSources(
      'zoo',
      zooId,
      resolveSources(item.sourceRefs),
      `zoo_organization:${item.organizationSlug}`,
      item.verifiedAt ?? DEFAULT_VERIFIED_AT,
      0.8,
    );
    linkedOrganizations += 1;
  }

  let derivedEdges = 0;
  async function upsertEdge(
    srcType: EntityType,
    srcId: string,
    predicate: string,
    dstType: EntityType,
    dstId: string,
    sourceId?: string,
    confidence?: number,
    note?: string,
  ): Promise<void> {
    derivedEdges += 1;
    await prisma.knowledgeEdge.upsert({
      where: {
        srcType_srcId_predicateCode_dstType_dstId: {
          srcType,
          srcId,
          predicateCode: predicate,
          dstType,
          dstId,
        },
      },
      update: { sourceId: sourceId ?? null, confidence: confidence ?? null, note: note ?? null },
      create: {
        srcType,
        srcId,
        predicateCode: predicate,
        dstType,
        dstId,
        sourceId: sourceId ?? null,
        confidence: confidence ?? null,
        note: note ?? null,
      },
    });
  }

  // Рёбра выводятся из нормализованных связей, чтобы граф не расходился с каталогами.
  for (const item of zoos) {
    const zooId = zooBySlug.get(item.slug);
    const cityId = zooId ? zooCityById.get(zooId) : null;
    if (zooId && cityId) {
      await upsertEdge('zoo', zooId, 'LOCATED_IN', 'city', cityId, zooSourceById.get(zooId), 1);
    }
  }
  for (const item of zooSpecies) {
    await upsertEdge(
      'zoo',
      zooBySlug.get(item.zooSlug) as string,
      'KEEPS',
      'species',
      taxonByName.get(item.scientificName) as string,
      resolveSources(item.sourceRefs)[0],
      0.9,
    );
  }
  for (const item of zooPrograms) {
    await upsertEdge(
      'zoo',
      zooBySlug.get(item.zooSlug) as string,
      'PARTICIPATES_IN',
      'program',
      programBySlug.get(item.programSlug) as string,
      resolveSources(item.sourceRefs)[0],
      0.8,
    );
  }
  for (const item of zooOrganizations) {
    await upsertEdge(
      'zoo',
      zooBySlug.get(item.zooSlug) as string,
      'MEMBER_OF',
      'organization',
      orgBySlug.get(item.organizationSlug) as string,
      resolveSources(item.sourceRefs)[0],
      0.8,
    );
  }
  for (const item of programs) {
    const programId = programBySlug.get(item.slug) as string;
    for (const speciesName of item.targetSpecies) {
      await upsertEdge(
        'program',
        programId,
        'TARGETS',
        'species',
        taxonByName.get(speciesName) as string,
        programSourceById.get(programId),
        0.9,
      );
    }
    if (item.organizationSlug) {
      const organizationId = orgBySlug.get(item.organizationSlug);
      if (organizationId) {
        await upsertEdge(
          'organization',
          organizationId,
          'OPERATES',
          'program',
          programId,
          orgSourceById.get(organizationId),
          0.9,
        );
      }
    }
  }
  for (const item of research) {
    const researchId = researchBySlug.get(item.slug) as string;
    for (const zooSlug of item.zooSlugs ?? []) {
      await upsertEdge(
        'zoo',
        zooBySlug.get(zooSlug) as string,
        'CONDUCTS',
        'research',
        researchId,
        researchSourceById.get(researchId),
        0.8,
      );
    }
    for (const name of item.speciesScientificNames ?? []) {
      await upsertEdge(
        'research',
        researchId,
        'STUDIES',
        'species',
        taxonByName.get(name) as string,
        researchSourceById.get(researchId),
        0.8,
      );
    }
  }
  for (const item of education) {
    const zooId = zooBySlug.get(item.zooSlug) as string;
    const row = await prisma.educationProgram.findFirst({
      where: {
        zooId,
        title: item.title,
        format: item.format as Prisma.EducationProgramCreateInput['format'],
      },
    });
    if (row) {
      await upsertEdge(
        'zoo',
        zooId,
        'OFFERS',
        'education',
        row.id,
        educationSourceById.get(row.id),
        0.8,
      );
    }
  }

  let linkedEdges = 0;
  for (const item of edges) {
    const srcId = resolveEdgeRef(item.srcType, item.srcRef);
    const dstId = resolveEdgeRef(item.dstType, item.dstRef);
    if (!srcId) throw new Error(`Unknown edge source ${item.srcType}:${item.srcRef}`);
    if (!dstId) throw new Error(`Unknown edge target ${item.dstType}:${item.dstRef}`);
    const refs = resolveSources(item.sourceRefs);
    await prisma.knowledgeEdge.upsert({
      where: {
        srcType_srcId_predicateCode_dstType_dstId: {
          srcType: item.srcType as EntityType,
          srcId,
          predicateCode: item.predicate,
          dstType: item.dstType as EntityType,
          dstId,
        },
      },
      update: {
        confidence: item.confidence ?? null,
        note: item.note ?? null,
        sourceId: refs[0] ?? null,
      },
      create: {
        srcType: item.srcType as EntityType,
        srcId,
        predicateCode: item.predicate,
        dstType: item.dstType as EntityType,
        dstId,
        confidence: item.confidence ?? null,
        note: item.note ?? null,
        sourceId: refs[0] ?? null,
      },
    });
    linkedEdges += 1;
  }

  function resolveEdgeRef(type: string, ref: string): string | null {
    switch (type) {
      case 'zoo':
        return zooBySlug.get(ref) ?? null;
      case 'species':
      case 'taxon':
        return taxonByName.get(ref) ?? null;
      case 'country':
        return countryByIso.get(ref) ?? countryBySlug.get(ref) ?? null;
      case 'city':
        return cityBySlug.get(ref) ?? null;
      case 'program':
        return programBySlug.get(ref) ?? null;
      case 'organization':
        return orgBySlug.get(ref) ?? null;
      case 'research':
        return researchBySlug.get(ref) ?? null;
      default:
        return null;
    }
  }

  for (const item of synonyms) {
    await prisma.searchSynonym.upsert({
      where: { term_synonym: { term: item.term, synonym: item.synonym } },
      update: {},
      create: { term: item.term, synonym: item.synonym },
    });
  }

  await seedAdmin();

  await prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW mv_search_index');

  const counts = {
    countries: await prisma.country.count(),
    cities: await prisma.city.count(),
    zoos: await prisma.zoo.count(),
    taxa: await prisma.taxon.count(),
    species: await prisma.speciesProfile.count(),
    programs: await prisma.conservationProgram.count(),
    organizations: await prisma.organization.count(),
    research: await prisma.researchProject.count(),
    education: await prisma.educationProgram.count(),
    sources: await prisma.source.count(),
    zooSpecies: await prisma.zooSpecies.count(),
    zooPrograms: await prisma.zooProgram.count(),
    zooOrganizations: await prisma.zooOrganization.count(),
    zooNews: await prisma.zooNews.count(),
    edges: await prisma.knowledgeEdge.count(),
    predicates: await prisma.predicate.count(),
    synonyms: await prisma.searchSynonym.count(),
  };
  process.stdout.write(
    `Seed complete: ${JSON.stringify(counts)} (linked species=${linkedSpecies}, programs=${linkedPrograms}, organizations=${linkedOrganizations}, ruled edges=${derivedEdges}, curated edges=${linkedEdges})\n`,
  );
}

main()
  .catch((error: unknown) => {
    process.stderr.write(
      `Seed failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

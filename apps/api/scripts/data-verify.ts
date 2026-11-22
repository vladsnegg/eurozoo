import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type Rec = Record<string, unknown>;
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

const SEEDS = resolve(__dirname, '../prisma/seeds');
const ALLOWLIST = resolve(__dirname, '../data/source-allowlist.json');

function load<T>(file: string): T {
  return JSON.parse(readFileSync(resolve(SEEDS, file), 'utf8')) as T;
}

const errors: string[] = [];
const warnings: string[] = [];

function fail(message: string): void {
  errors.push(message);
}

function warn(message: string): void {
  warnings.push(message);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function list<T = Rec>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function kebab(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function isoDate(value: unknown): boolean {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function urlOf(value: unknown): URL | null {
  if (typeof value !== 'string') return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function uniqueBy<T>(items: T[], key: (item: T) => string, label: string): void {
  const seen = new Map<string, number>();
  for (const item of items) {
    const value = key(item);
    if (!value) continue;
    seen.set(value, (seen.get(value) ?? 0) + 1);
  }
  for (const [value, count] of seen) {
    if (count > 1) fail(`${label}: дубль «${value}» (${count})`);
  }
}

const MINIMUMS: Record<string, number> = {
  countries: 12,
  cities: 25,
  zoos: 30,
  species: 60,
  organizations: 10,
  programs: 15,
  research: 8,
  education: 20,
  zooSpecies: 150,
  zooPrograms: 60,
  sources: 80,
  edges: 40,
};

async function main(): Promise<void> {
  const allow = JSON.parse(readFileSync(ALLOWLIST, 'utf8')) as { hosts: string[] };
  const allowHosts = allow.hosts.map((h) => h.toLowerCase());
  const online = process.argv.includes('--online');

  const iucn = load<Rec[]>('iucn.json');
  const ranks = load<Rec[]>('ranks.json');
  const countries = load<Rec[]>('countries.json');
  const cities = load<Rec[]>('cities.json');
  const habitats = load<Rec[]>('habitats.json');
  const sources = load<SourceSeed[]>('sources.json');
  const zoos = load<Rec[]>('zoos.json');
  const taxa = load<Rec[]>('taxa.json');
  const organizations = load<Rec[]>('organizations.json');
  const programs = load<Rec[]>('programs.json');
  const research = load<Rec[]>('research.json');
  const education = load<Rec[]>('education.json');
  const zooSpecies = load<Rec[]>('zoo-species.json');
  const zooPrograms = load<Rec[]>('zoo-programs.json');
  const zooOrganizations = load<Rec[]>('zoo-organizations.json');
  const edges = load<Rec[]>('edges.json');
  const predicates = load<Rec[]>('predicates.json');

  const sourceIds = new Set(sources.map((s) => s.id));
  const usedSources = new Set<string>();

  function refsOf(item: Rec, label: string): string[] {
    const refs = list<string>(item.sourceRefs);
    if (refs.length === 0) fail(`${label}: нет sourceRefs`);
    for (const ref of refs) {
      usedSources.add(ref);
      if (!sourceIds.has(ref)) fail(`${label}: неизвестный источник «${ref}»`);
    }
    return refs;
  }

  // ---------- sources ----------
  uniqueBy(sources, (s) => s.id, 'sources.id');
  uniqueBy(sources, (s) => s.url, 'sources.url');
  const sourceTypes = ['official_site', 'scientific', 'database', 'media', 'community'];
  const reliabilities = ['official', 'scientific', 'database', 'media', 'community'];
  for (const source of sources) {
    if (!source.id || !kebab(source.id)) fail(`source ${source.url}: id должен быть kebab-case`);
    if (!source.title) fail(`source ${source.id}: пустой title`);
    const url = urlOf(source.url);
    if (!url) {
      fail(`source ${source.id}: некорректный URL «${source.url}»`);
      continue;
    }
    if (url.protocol !== 'https:') fail(`source ${source.id}: URL должен быть https`);
    const host = url.hostname.replace(/^www\./, '');
    const allowed = allowHosts.some((d) => host === d || host.endsWith(`.${d}`));
    if (!allowed) fail(`source ${source.id}: домен ${url.hostname} не в allowlist`);
    if (!isoDate(source.accessedAt)) fail(`source ${source.id}: некорректный accessedAt`);
    if (source.accessedAt && Date.parse(source.accessedAt) > Date.now()) {
      fail(`source ${source.id}: accessedAt в будущем`);
    }
    if (source.publishedAt && !isoDate(source.publishedAt)) {
      fail(`source ${source.id}: некорректный publishedAt`);
    }
    if (!sourceTypes.includes(source.type)) fail(`source ${source.id}: неизвестный type ${source.type}`);
    if (!reliabilities.includes(source.reliability)) {
      fail(`source ${source.id}: неизвестный reliability ${source.reliability}`);
    }
  }

  // ---------- geography ----------
  uniqueBy(countries, (c) => text(c.iso2), 'countries.iso2');
  uniqueBy(countries, (c) => text(c.iso3), 'countries.iso3');
  uniqueBy(countries, (c) => text(c.slug), 'countries.slug');
  const countryByIso = new Set(countries.map((c) => text(c.iso2)));
  for (const country of countries) {
    if (text(country.iso2).length !== 2) fail(`country ${text(country.slug)}: iso2 должен быть из 2 букв`);
    if (text(country.iso3).length !== 3) fail(`country ${text(country.slug)}: iso3 должен быть из 3 букв`);
    if (!kebab(text(country.slug))) fail(`country ${text(country.slug)}: slug не kebab-case`);
  }

  uniqueBy(cities, (c) => text(c.slug), 'cities.slug');
  const cityBySlug = new Map(cities.map((c) => [text(c.slug), c]));
  for (const city of cities) {
    if (!kebab(text(city.slug))) fail(`city ${text(city.slug)}: slug не kebab-case`);
    if (!countryByIso.has(text(city.countryIso2))) {
      fail(`city ${text(city.slug)}: неизвестная страна ${text(city.countryIso2)}`);
    }
    const lat = Number(city.lat);
    const lng = Number(city.lng);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) fail(`city ${text(city.slug)}: некорректная lat`);
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) fail(`city ${text(city.slug)}: некорректная lng`);
  }

  // ---------- habitats / iucn / ranks ----------
  const habitatSlugs = new Set(habitats.map((h) => text(h.slug)));
  uniqueBy(habitats, (h) => text(h.slug), 'habitats.slug');
  const iucnCodes = new Set(iucn.map((i) => text(i.code)));
  uniqueBy(iucn, (i) => text(i.code), 'iucn.code');
  const rankByCode = new Map(ranks.map((r) => [text(r.code), Number(r.level)]));
  uniqueBy(ranks, (r) => text(r.code), 'ranks.code');

  // ---------- zoos ----------
  uniqueBy(zoos, (z) => text(z.slug), 'zoos.slug');
  const zooBySlug = new Map(zoos.map((z) => [text(z.slug), z]));
  for (const zoo of zoos) {
    const slug = text(zoo.slug);
    if (!kebab(slug)) fail(`zoo ${slug}: slug не kebab-case`);
    const city = cityBySlug.get(text(zoo.citySlug));
    if (!city) {
      fail(`zoo ${slug}: неизвестный город ${text(zoo.citySlug)}`);
    } else if (text(city.countryIso2) !== text(zoo.countryIso2)) {
      fail(`zoo ${slug}: страна не совпадает с городом (${text(zoo.countryIso2)})`);
    }
    if (!countryByIso.has(text(zoo.countryIso2))) fail(`zoo ${slug}: неизвестная страна`);
    const refs = refsOf(zoo, `zoo ${slug}`);
    const published = text(zoo.publishStatus || 'published') === 'published';
    if (published && refs.length === 0) fail(`zoo ${slug}: published без источника`);
    const lat = Number(zoo.lat);
    const lng = Number(zoo.lng);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) fail(`zoo ${slug}: некорректная lat`);
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) fail(`zoo ${slug}: некорректная lng`);
    const year = Number(zoo.foundedYear);
    if (!Number.isInteger(year) || year < 1200 || year > 2026) {
      fail(`zoo ${slug}: некорректный foundedYear`);
    }
    const website = urlOf(zoo.website);
    if (!website) fail(`zoo ${slug}: некорректный website`);
    if (zoo.coordSourceRef) {
      usedSources.add(text(zoo.coordSourceRef));
      if (!sourceIds.has(text(zoo.coordSourceRef))) {
        fail(`zoo ${slug}: неизвестный coordSourceRef`);
      }
    }
    if (zoo.verifiedAt && !isoDate(zoo.verifiedAt)) fail(`zoo ${slug}: некорректный verifiedAt`);
  }

  // ---------- taxonomy ----------
  uniqueBy(taxa, (t) => text(t.scientificName), 'taxa.scientificName');
  uniqueBy(taxa, (t) => text(t.slug), 'taxa.slug');
  const taxonIndex = new Map(taxa.map((t, index) => [text(t.scientificName), index]));
  const taxonBySlug = new Map(taxa.map((t) => [text(t.slug), t]));
  const speciesNames = new Set<string>();
  for (const [index, taxon] of taxa.entries()) {
    const name = text(taxon.scientificName);
    const slug = text(taxon.slug);
    if (!kebab(slug)) fail(`taxon ${name}: slug не kebab-case`);
    const level = rankByCode.get(text(taxon.rankCode));
    if (level === undefined) fail(`taxon ${name}: неизвестный ранг ${text(taxon.rankCode)}`);
    const parentName = text(taxon.parentScientificName);
    if (parentName) {
      const parentIndex = taxonIndex.get(parentName);
      if (parentIndex === undefined) fail(`taxon ${name}: неизвестный родитель ${parentName}`);
      else {
        if (parentIndex > index) fail(`taxon ${name}: родитель должен идти раньше`);
        const parentLevel = rankByCode.get(text(taxa[parentIndex]?.rankCode));
        if (level !== undefined && parentLevel !== undefined && parentLevel >= level) {
          fail(`taxon ${name}: ранг родителя не выше дочернего`);
        }
      }
    } else if (text(taxon.rankCode) !== 'kingdom') {
      fail(`taxon ${name}: отсутствует родитель`);
    }
    const isSpecies = text(taxon.rankCode) === 'species';
    const refs = isSpecies ? refsOf(taxon, `taxon ${name}`) : list<string>(taxon.sourceRefs);
    for (const ref of refs) {
      usedSources.add(ref);
      if (!sourceIds.has(ref)) fail(`taxon ${name}: неизвестный источник «${ref}»`);
    }
    const published = text(taxon.publishStatus || 'published') === 'published';
    if (isSpecies && published && refs.length === 0) fail(`taxon ${name}: published без источника`);
    for (const habitat of list<string>(taxon.habitatSlugs)) {
      if (!habitatSlugs.has(habitat)) fail(`taxon ${name}: неизвестный habitat ${habitat}`);
    }
    if (text(taxon.rankCode) === 'species') {
      speciesNames.add(name);
      const imageUrl = text(taxon.imageUrl);
      if (!imageUrl) {
        fail(`taxon ${name}: нет изображения (imageUrl)`);
      } else {
        const relative = imageUrl.replace(/^\//, '');
        const candidates = [
          resolve(process.cwd(), 'apps/web/public', relative),
          resolve(process.cwd(), '../apps/web/public', relative),
          resolve(__dirname, '../../../apps/web/public', relative),
          resolve(__dirname, '../../web/public', relative),
        ];
        if (!candidates.some((path) => existsSync(path))) {
          fail(`taxon ${name}: файл изображения не найден (${imageUrl})`);
        }
      }
      if (!taxon.profile) fail(`taxon ${name}: у вида нет profile`);
      if (!text(taxon.iucnCode) || !iucnCodes.has(text(taxon.iucnCode))) {
        fail(`taxon ${name}: некорректный iucnCode`);
      } else if (!taxon.iucnSourceRef) {
        warn(`taxon ${name}: нет отдельного iucnSourceRef (будет использован общий IUCN)`);
      }
      const year = taxon.yearDescribed === undefined ? null : Number(taxon.yearDescribed);
      if (year !== null && (!Number.isInteger(year) || year < 1700 || year > 2026)) {
        fail(`taxon ${name}: некорректный yearDescribed`);
      }
    }
    if (taxon.iucnSourceRef) {
      usedSources.add(text(taxon.iucnSourceRef));
      if (!sourceIds.has(text(taxon.iucnSourceRef))) fail(`taxon ${name}: неизвестный iucnSourceRef`);
    }
  }

  // ---------- organizations / programs / research ----------
  uniqueBy(organizations, (o) => text(o.slug), 'organizations.slug');
  const orgSlugs = new Set(organizations.map((o) => text(o.slug)));
  const countrySlugs = new Set(countries.map((c) => text(c.slug)));
  for (const org of organizations) {
    const slug = text(org.slug);
    if (!kebab(slug)) fail(`organization ${slug}: slug не kebab-case`);
    if (text(org.countrySlug) && !countrySlugs.has(text(org.countrySlug))) {
      fail(`organization ${slug}: неизвестная страна`);
    }
    const refs = refsOf(org, `organization ${slug}`);
    if (text(org.publishStatus || 'published') === 'published' && refs.length === 0) {
      fail(`organization ${slug}: published без источника`);
    }
  }
  uniqueBy(organizations, (o) => text(o.acronym), 'organizations.acronym');

  uniqueBy(programs, (p) => text(p.slug), 'programs.slug');
  const programBySlug = new Map(programs.map((p) => [text(p.slug), p]));
  for (const program of programs) {
    const slug = text(program.slug);
    if (!kebab(slug)) fail(`program ${slug}: slug не kebab-case`);
    if (text(program.organizationSlug) && !orgSlugs.has(text(program.organizationSlug))) {
      fail(`program ${slug}: неизвестная организация`);
    }
    for (const name of list<string>(program.targetSpecies)) {
      if (!speciesNames.has(name)) fail(`program ${slug}: неизвестный целевой вид ${name}`);
    }
    const refs = refsOf(program, `program ${slug}`);
    if (text(program.publishStatus || 'draft') === 'published' && refs.length === 0) {
      fail(`program ${slug}: published без источника`);
    }
    const started = program.startedYear === undefined || program.startedYear === null ? null : Number(program.startedYear);
    if (started !== null && (!Number.isInteger(started) || started < 1900 || started > 2026)) {
      fail(`program ${slug}: некорректный startedYear`);
    }
  }

  uniqueBy(research, (r) => text(r.slug), 'research.slug');
  const researchSlugs = new Set(research.map((r) => text(r.slug)));
  for (const project of research) {
    const slug = text(project.slug);
    if (!kebab(slug)) fail(`research ${slug}: slug не kebab-case`);
    if (text(project.leadOrganizationSlug) && !orgSlugs.has(text(project.leadOrganizationSlug))) {
      fail(`research ${slug}: неизвестная lead-организация`);
    }
    for (const zooSlug of list<string>(project.zooSlugs)) {
      if (!zooBySlug.has(zooSlug)) fail(`research ${slug}: неизвестный зоопарк ${zooSlug}`);
    }
    for (const name of list<string>(project.speciesScientificNames)) {
      if (!speciesNames.has(name)) fail(`research ${slug}: неизвестный вид ${name}`);
    }
    const refs = refsOf(project, `research ${slug}`);
    if (text(project.publishStatus || 'draft') === 'published' && refs.length === 0) {
      fail(`research ${slug}: published без источника`);
    }
  }

  // ---------- education / relations ----------
  for (const item of education) {
    const zooSlug = text(item.zooSlug);
    if (!zooBySlug.has(zooSlug)) fail(`education «${text(item.title)}»: неизвестный зоопарк ${zooSlug}`);
    if (!['children', 'schools', 'adults', 'families', 'professionals'].includes(text(item.audience))) {
      fail(`education «${text(item.title)}»: неизвестная audience`);
    }
    if (!['tour', 'workshop', 'lecture', 'course', 'exhibition'].includes(text(item.format))) {
      fail(`education «${text(item.title)}»: неизвестный format`);
    }
    if (item.url && !urlOf(item.url)) fail(`education «${text(item.title)}»: некорректный url`);
    refsOf(item, `education «${text(item.title)}»`);
  }
  uniqueBy(
    education,
    (item) => `${text(item.zooSlug)}|${text(item.title)}|${text(item.format)}`,
    'education',
  );

  uniqueBy(zooSpecies, (r) => `${text(r.zooSlug)}|${text(r.scientificName)}`, 'zoo-species');
  for (const relation of zooSpecies) {
    const zooSlug = text(relation.zooSlug);
    const name = text(relation.scientificName);
    if (!zooBySlug.has(zooSlug)) fail(`zoo-species: неизвестный зоопарк ${zooSlug}`);
    if (!speciesNames.has(name)) fail(`zoo-species: неизвестный вид ${name} (${zooSlug})`);
    refsOf(relation, `zoo-species ${zooSlug}/${name}`);
    for (const field of ['countMale', 'countFemale', 'countUnsexed'] as const) {
      const value = relation[field];
      if (value !== undefined && value !== null && (!Number.isInteger(value) || Number(value) < 0)) {
        fail(`zoo-species ${zooSlug}/${name}: некорректный ${field}`);
      }
    }
  }

  uniqueBy(zooPrograms, (r) => `${text(r.zooSlug)}|${text(r.programSlug)}`, 'zoo-programs');
  for (const relation of zooPrograms) {
    if (!zooBySlug.has(text(relation.zooSlug))) fail(`zoo-programs: неизвестный зоопарк`);
    if (!programBySlug.has(text(relation.programSlug))) fail(`zoo-programs: неизвестная программа`);
    if (!['coordinator', 'participant', 'former'].includes(text(relation.role || 'participant'))) {
      fail(`zoo-programs: неизвестная роль`);
    }
    refsOf(relation, `zoo-programs ${text(relation.zooSlug)}/${text(relation.programSlug)}`);
  }

  uniqueBy(zooOrganizations, (r) => `${text(r.zooSlug)}|${text(r.organizationSlug)}`, 'zoo-organizations');
  for (const relation of zooOrganizations) {
    if (!zooBySlug.has(text(relation.zooSlug))) fail(`zoo-organizations: неизвестный зоопарк`);
    if (!orgSlugs.has(text(relation.organizationSlug))) fail(`zoo-organizations: неизвестная организация`);
    refsOf(relation, `zoo-organizations ${text(relation.zooSlug)}/${text(relation.organizationSlug)}`);
  }

  const predicateCodes = new Set(predicates.map((p) => text(p.code)));
  uniqueBy(edges, (e) => `${text(e.srcType)}|${text(e.srcRef)}|${text(e.predicate)}|${text(e.dstType)}|${text(e.dstRef)}`, 'edges');
  function resolveEdge(type: string, ref: string): boolean {
    switch (type) {
      case 'zoo':
        return zooBySlug.has(ref);
      case 'species':
        return speciesNames.has(ref);
      case 'taxon':
        return taxonBySlug.has(ref) || taxonIndex.has(ref);
      case 'country':
        return countryByIso.has(ref) || countries.some((c) => text(c.slug) === ref);
      case 'city':
        return cityBySlug.has(ref);
      case 'program':
        return programBySlug.has(ref);
      case 'organization':
        return orgSlugs.has(ref);
      case 'research':
        return researchSlugs.has(ref);
      default:
        return false;
    }
  }
  for (const edge of edges) {
    const label = `${text(edge.srcType)}:${text(edge.srcRef)} -${text(edge.predicate)}-> ${text(edge.dstType)}:${text(edge.dstRef)}`;
    if (!predicateCodes.has(text(edge.predicate))) fail(`edge ${label}: неизвестный предикат`);
    if (!resolveEdge(text(edge.srcType), text(edge.srcRef))) fail(`edge ${label}: не найден источник`);
    if (!resolveEdge(text(edge.dstType), text(edge.dstRef))) fail(`edge ${label}: не найдена цель`);
    if (text(edge.srcType) === text(edge.dstType) && text(edge.srcRef) === text(edge.dstRef)) {
      fail(`edge ${label}: петля`);
    }
    refsOf(edge, `edge ${label}`);
  }

  // ---------- coverage ----------
  const counts: Record<keyof typeof MINIMUMS, number> = {
    countries: countries.length,
    cities: cities.length,
    zoos: zoos.length,
    species: [...speciesNames].length,
    organizations: organizations.length,
    programs: programs.length,
    research: research.length,
    education: education.length,
    zooSpecies: zooSpecies.length,
    zooPrograms: zooPrograms.length,
    sources: sources.length,
    // Граф наполняется не только edges.json, но и рёбрами, выводимыми из связей при сиде.
    edges: edges.length + zooSpecies.length + zooPrograms.length,
  };
  for (const [key, minimum] of Object.entries(MINIMUMS)) {
    const value = counts[key as keyof typeof MINIMUMS];
    if (value < minimum) fail(`покрытие ${key}: ${value} < ${minimum}`);
  }
  for (const id of sourceIds) {
    if (!usedSources.has(id)) warn(`source ${id} не используется ни одной сущностью`);
  }

  const totalRelations = zooSpecies.length + zooPrograms.length + zooOrganizations.length + edges.length;

  process.stdout.write('Покрытие данных:\n');
  for (const [key, value] of Object.entries(counts)) {
    const minimum = MINIMUMS[key as keyof typeof MINIMUMS];
    const mark = value >= minimum ? 'ok' : 'FAIL';
    process.stdout.write(`  [${mark}] ${key}: ${value} (min ${minimum})\n`);
  }
  process.stdout.write(`Связи: ${totalRelations}\n`);

  if (online) {
    await checkUrlsOnline([...new Set(sources.map((s) => s.url))]);
  }

  for (const message of warnings) process.stdout.write(`[warn] ${message}\n`);
  if (errors.length > 0) {
    for (const message of errors) process.stderr.write(`[FAIL] ${message}\n`);
    process.stderr.write(`data:verify: ${errors.length} ошибок, ${warnings.length} предупреждений\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(`data:verify: ok (${warnings.length} предупреждений)\n`);
  process.stdout.write(
    `Всего источников: ${sources.length}; проверено онлайн: ${online ? sources.length : 0}\n`,
  );
}

async function checkUrlsOnline(urls: string[]): Promise<void> {
  const queue = [...urls];
  const workers = Array.from({ length: 8 }, async () => {
    for (;;) {
      const url = queue.shift();
      if (!url) return;
      try {
        const head = await fetch(url, {
          method: 'HEAD',
          redirect: 'follow',
          signal: AbortSignal.timeout(15000),
          headers: { 'user-agent': 'EuroZooAtlas/0.1 (data verification)' },
        });
        if (head.ok) continue;
        const get = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
          signal: AbortSignal.timeout(20000),
          headers: { 'user-agent': 'EuroZooAtlas/0.1 (data verification)' },
        });
        if (!get.ok) warn(`URL ${url}: HTTP ${get.status}`);
      } catch (error) {
        warn(`URL ${url}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  });
  await Promise.all(workers);
}

main().catch((error: unknown) => {
  process.stderr.write(`data:verify failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});

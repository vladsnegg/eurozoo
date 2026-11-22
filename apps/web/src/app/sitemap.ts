import type { MetadataRoute } from 'next';
import type {
  CountrySummaryDto,
  OrganizationSummaryDto,
  ProgramSummaryDto,
  SpeciesSummaryDto,
  ZooSummaryDto,
} from '@eurozoo/shared';
import { safeList } from '@/lib/api';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [zoos, species, countries, programs, organizations] = await Promise.all([
    safeList<ZooSummaryDto>('/zoos', { pageSize: 1000 }),
    safeList<SpeciesSummaryDto>('/species', { pageSize: 1000 }),
    safeList<CountrySummaryDto>('/countries', { pageSize: 1000 }),
    safeList<ProgramSummaryDto>('/programs', { pageSize: 1000 }),
    safeList<OrganizationSummaryDto>('/organizations', { pageSize: 1000 }),
  ]);

  const now = new Date();

  return [
    { url: `${BASE}/`, lastModified: now },
    { url: `${BASE}/zoos`, lastModified: now },
    { url: `${BASE}/species`, lastModified: now },
    { url: `${BASE}/taxonomy`, lastModified: now },
    { url: `${BASE}/countries`, lastModified: now },
    { url: `${BASE}/news`, lastModified: now },
    { url: `${BASE}/programs`, lastModified: now },
    { url: `${BASE}/organizations`, lastModified: now },
    { url: `${BASE}/research`, lastModified: now },
    { url: `${BASE}/sources`, lastModified: now },
    ...zoos.map((zoo) => ({
      url: `${BASE}/zoos/${zoo.slug}`,
      lastModified: new Date(zoo.updatedAt),
    })),
    ...species.map((item) => ({ url: `${BASE}/species/${item.slug}`, lastModified: now })),
    ...countries.map((country) => ({
      url: `${BASE}/countries/${country.slug}`,
      lastModified: now,
    })),
    ...programs.map((program) => ({ url: `${BASE}/programs/${program.slug}`, lastModified: now })),
    ...organizations.map((org) => ({
      url: `${BASE}/organizations/${org.slug}`,
      lastModified: now,
    })),
  ];
}

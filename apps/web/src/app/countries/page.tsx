import type { Metadata } from 'next';
import type { CountrySummaryDto, ZooSummaryDto } from '@eurozoo/shared';
import { EuropeAtlasMap } from '@/components/europe-atlas-map';
import { CountryFlag } from '@/components/country-flag';
import { EntityCard } from '@/components/knowledge';
import { Badge, EmptyState, PageHeader, Pagination } from '@/components/page';
import { first, getList, pageOf, safeList } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'География Европы',
  description: 'Страны Европы и связанные с ними зоопарки и виды на интерактивной карте.',
};

export default async function CountriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = pageOf(sp.page);
  const order = first(sp.order) === 'desc' ? 'desc' : 'asc';
  const [countries, zoos] = await Promise.all([
    getList<CountrySummaryDto>('/countries', { page, pageSize: 24, order }),
    safeList<ZooSummaryDto>('/zoos', { pageSize: 1000 }),
  ]);

  const mapPoints = zoos.map((z) => ({
    slug: z.slug,
    name: z.name,
    city: z.city.name,
    country: z.locationLabel ?? z.city.country.name,
    iso2: z.city.country.iso2,
    neutral: z.locationLabel === 'Крым',
    foundedYear: z.foundedYear,
    speciesCount: z.speciesCount,
    lat: z.lat,
    lng: z.lng,
  }));

  return (
    <>
      <PageHeader
        eyebrow="География"
        title="Страны и города Европы"
        description="Страны и города Европы на карте."
      />

      {mapPoints.length > 0 ? (
        <div className="mb-6">
          <EuropeAtlasMap zoos={mapPoints} />
        </div>
      ) : null}

      {countries.items.length === 0 ? (
        <EmptyState title="Страны не найдены" />
      ) : (
        <ul className="mt-6 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {countries.items.map((country) => (
            <li key={country.id}>
              <EntityCard
                href={`/countries/${country.slug}`}
                type="country"
                title={country.name}
                badge={
                  <span className="inline-flex items-center gap-1.5">
                    <CountryFlag iso2={country.iso2} size={18} />
                    <span className="specimen-iso-tag">
                      {country.iso2} / {country.iso3}
                    </span>
                  </span>
                }
                subtitle={country.nameLocal}
                meta={
                  <div className="flex flex-wrap items-center gap-1.5">
                    {country.euMember ? (
                      <Badge tone="info">Европейский союз</Badge>
                    ) : (
                      <Badge tone="neutral">Европа (вне ЕС)</Badge>
                    )}
                  </div>
                }
              />
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={countries.page}
        pageSize={countries.pageSize}
        total={countries.total}
        pathname="/countries"
        query={{ order, page: undefined }}
      />
    </>
  );
}

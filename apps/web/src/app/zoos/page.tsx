import type { Metadata } from 'next';
import type { CountrySummaryDto, ZooSummaryDto } from '@eurozoo/shared';
import { EuropeAtlasMap } from '@/components/europe-atlas-map';
import { CountryFlag } from '@/components/country-flag';
import { FilterForm, CheckboxField, SelectField, NumberField } from '@/components/filter-form';
import { EntityCard } from '@/components/knowledge';
import { Badge, EmptyState, PageHeader, Pagination } from '@/components/page';
import { first, getList, pageOf, safeList } from '@/lib/api';
import { formatCoord, formatNumber, formatYear } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Зоопарки Европы',
  description:
    'Каталог европейских зоопарков с интерактивной картой координат, фильтрами по стране, году основания и коллекциям.',
};

export default async function ZoosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = pageOf(sp.page);
  const filters = {
    country: first(sp.country),
    yearFrom: first(sp.yearFrom),
    yearTo: first(sp.yearTo),
    hasPrograms: first(sp.hasPrograms),
    hasThreatened: first(sp.hasThreatened),
    hasCoords: first(sp.hasCoords),
    sort: first(sp.sort),
    order: first(sp.order),
  };

  const [zoos, allMatchingZoos, countries] = await Promise.all([
    getList<ZooSummaryDto>('/zoos', {
      country: filters.country,
      yearFrom: filters.yearFrom,
      yearTo: filters.yearTo,
      hasPrograms: filters.hasPrograms,
      hasThreatened: filters.hasThreatened,
      hasCoords: filters.hasCoords,
      sort: filters.sort,
      order: filters.order,
      page,
      pageSize: 24,
    }),
    safeList<ZooSummaryDto>('/zoos', {
      country: filters.country,
      yearFrom: filters.yearFrom,
      yearTo: filters.yearTo,
      hasPrograms: filters.hasPrograms,
      hasThreatened: filters.hasThreatened,
      hasCoords: filters.hasCoords,
      pageSize: 1000,
    }),
    safeList<CountrySummaryDto>('/countries', { pageSize: 100 }),
  ]);

  const mapSource = allMatchingZoos.length > 0 ? allMatchingZoos : zoos.items;
  const mapPoints = mapSource.map((z) => ({
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
        eyebrow="Каталог"
        title="Зоопарки Европы"
        description="Верифицированный каталог европейских зоопарков."
      />

      {mapPoints.length > 0 ? (
        <div className="mb-6">
          <EuropeAtlasMap zoos={mapPoints} />
        </div>
      ) : null}

      <FilterForm action="/zoos" resetHref="/zoos" total={zoos.total}>
        <SelectField
          label="Страна"
          name="country"
          value={filters.country}
          options={countries.map((country) => ({
            value: country.slug,
            label: `${country.name} (${country.iso2})`,
          }))}
        />
        <NumberField
          label="Год основания: с"
          name="yearFrom"
          value={filters.yearFrom}
          min={1200}
          max={2100}
          placeholder="например, 1752"
        />
        <NumberField
          label="Год основания: по"
          name="yearTo"
          value={filters.yearTo}
          min={1200}
          max={2100}
          placeholder="например, 2020"
        />
        <SelectField
          label="Сортировка"
          name="sort"
          value={filters.sort}
          anyLabel="По названию"
          options={[
            { value: 'foundedYear', label: 'По году основания' },
            { value: 'speciesCount', label: 'По числу видов' },
            { value: 'updatedAt', label: 'По обновлению' },
          ]}
        />
        <SelectField
          label="Порядок"
          name="order"
          value={filters.order}
          anyLabel="По возрастанию"
          options={[{ value: 'desc', label: 'По убыванию' }]}
        />
        <CheckboxField
          label="Участвует в программах EEP"
          name="hasPrograms"
          checked={filters.hasPrograms === 'true'}
        />
        <CheckboxField
          label="Содержит угрожаемые виды"
          name="hasThreatened"
          checked={filters.hasThreatened === 'true'}
        />
        <CheckboxField
          label="Есть координаты WGS84"
          name="hasCoords"
          checked={filters.hasCoords === 'true'}
        />
      </FilterForm>

      {zoos.items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Ничего не найдено"
            description="Попробуйте изменить параметры фильтрации или сбросить их."
          />
        </div>
      ) : (
        <ul className="mt-6 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {zoos.items.map((zoo) => (
            <li key={zoo.id}>
              <EntityCard
                href={`/zoos/${zoo.slug}`}
                type="zoo"
                title={zoo.name}
                badge={
                  <span className="inline-flex items-center gap-1.5">
                    {zoo.locationLabel ? null : (
                      <CountryFlag iso2={zoo.city.country.iso2} size={18} />
                    )}
                    <span className="specimen-iso-tag">
                      {zoo.locationLabel
                        ? zoo.locationLabel.toUpperCase()
                        : `${zoo.city.country.iso2} · ${zoo.foundedYear ? `EST. ${zoo.foundedYear}` : 'ACTIVE'}`}
                    </span>
                  </span>
                }
                subtitle={
                  zoo.nameLocal && zoo.nameLocal !== zoo.name
                    ? `${zoo.city.name}, ${zoo.locationLabel ?? zoo.city.country.name} · ${zoo.nameLocal}`
                    : `${zoo.city.name}, ${zoo.locationLabel ?? zoo.city.country.name}`
                }
                meta={
                  <div className="grid gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {zoo.hasPrograms ? <Badge tone="accent">EEP / ESB</Badge> : null}
                      {zoo.hasThreatened ? <Badge tone="warning">IUCN Red List</Badge> : null}
                      <span className="font-mono text-[11px] text-muted">
                        {formatCoord(zoo.lat, zoo.lng)}
                      </span>
                    </div>
                    <dl className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface-soft px-3 py-2 text-xs">
                      <div>
                        <dt className="font-mono text-[10px] uppercase text-muted">Основан</dt>
                        <dd className="m-0 mt-0.5 font-mono text-sm font-bold text-text">
                          {formatYear(zoo.foundedYear)}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-mono text-[10px] uppercase text-muted">
                          Видов в атласе
                        </dt>
                        <dd className="m-0 mt-0.5 font-mono text-sm font-bold text-accent">
                          {formatNumber(zoo.speciesCount)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                }
              />
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={zoos.page}
        pageSize={zoos.pageSize}
        total={zoos.total}
        pathname="/zoos"
        query={{ ...filters, page: undefined }}
      />
    </>
  );
}

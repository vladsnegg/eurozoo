import type { Metadata } from 'next';
import type { CountrySummaryDto, SpeciesSummaryDto } from '@eurozoo/shared';
import { CheckboxField, FilterForm, SelectField } from '@/components/filter-form';
import { EntityCard, IucnBadge, IucnSpectrum } from '@/components/knowledge';
import { EmptyState, PageHeader, Pagination } from '@/components/page';
import { first, getList, pageOf, safeArray, safeList } from '@/lib/api';
import { formatNumber } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Виды животных',
  description: 'Каталог биологических видов с охранным статусом IUCN, таксономией и зоопарками.',
};

const IUCN_OPTIONS = [
  { value: 'CR', label: 'CR — на грани исчезновения' },
  { value: 'EN', label: 'EN — исчезающий' },
  { value: 'VU', label: 'VU — уязвимый' },
  { value: 'NT', label: 'NT — близкий к уязвимому' },
  { value: 'LC', label: 'LC — наименьшие опасения' },
  { value: 'EW', label: 'EW — исчез в дикой природе' },
];

type TaxonNode = { slug: string; scientificName: string; rank: { code: string } };

export default async function SpeciesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = pageOf(sp.page);
  const filters = {
    iucn: first(sp.iucn),
    family: first(sp.family),
    country: first(sp.country),
    hasPrograms: first(sp.hasPrograms),
    sort: first(sp.sort),
    order: first(sp.order),
  };

  const [species, countries, families] = await Promise.all([
    getList<SpeciesSummaryDto>('/species', { ...filters, page, pageSize: 24 }),
    safeList<CountrySummaryDto>('/countries', { pageSize: 100 }),
    safeArray<TaxonNode>('/taxonomy', { rank: 'family' }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Биоразнообразие"
        title="Виды животных"
        description="Виды с охранным статусом IUCN и картой содержания."
      />

      <FilterForm action="/species" resetHref="/species" total={species.total}>
        <SelectField
          label="Охранный статус IUCN"
          name="iucn"
          value={filters.iucn}
          options={IUCN_OPTIONS}
        />
        <SelectField
          label="Семейство"
          name="family"
          value={filters.family}
          options={families.map((family) => ({
            value: family.slug,
            label: family.scientificName,
          }))}
        />
        <SelectField
          label="Страна содержания"
          name="country"
          value={filters.country}
          options={countries.map((country) => ({ value: country.slug, label: country.name }))}
        />
        <SelectField
          label="Сортировка"
          name="sort"
          value={filters.sort}
          anyLabel="По научному названию"
          options={[
            { value: 'zooCount', label: 'По числу зоопарков' },
            { value: 'programCount', label: 'По числу программ' },
          ]}
        />
        <CheckboxField
          label="Охвачен программами EEP/ESB"
          name="hasPrograms"
          checked={filters.hasPrograms === 'true'}
        />
      </FilterForm>

      {species.items.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Виды не найдены" description="Измените фильтры или сбросьте их." />
        </div>
      ) : (
        <ul className="mt-6 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {species.items.map((item) => (
            <li key={item.id}>
              <EntityCard
                href={`/species/${item.slug}`}
                type="species"
                title={item.scientificName}
                italicTitle
                imageUrl={item.imageUrl}
                imageAlt={item.commonNameRu ?? item.scientificName}
                badge={<IucnBadge iucn={item.iucn} />}
                subtitle={
                  [item.commonNameRu, item.commonNameEn !== item.scientificName ? item.commonNameEn : null]
                    .filter(Boolean)
                    .join(' · ') || null
                }
                meta={
                  <div className="grid gap-3">
                    <IucnSpectrum activeCode={item.iucn?.code} />
                    <dl className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface-soft px-3 py-2 text-xs">
                      <div>
                        <dt className="font-mono text-[10px] uppercase text-muted">Зоопарков</dt>
                        <dd className="m-0 mt-0.5 font-mono text-sm font-bold text-text">
                          {formatNumber(item.zooCount)}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-mono text-[10px] uppercase text-muted">Программ EEP</dt>
                        <dd className="m-0 mt-0.5 font-mono text-sm font-bold text-accent">
                          {formatNumber(item.programCount)}
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
        page={species.page}
        pageSize={species.pageSize}
        total={species.total}
        pathname="/species"
        query={{ ...filters, page: undefined }}
      />
    </>
  );
}

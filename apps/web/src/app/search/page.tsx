import type { Metadata } from 'next';
import Link from 'next/link';
import type { SearchResponseDto } from '@eurozoo/shared';
import { PageHeader } from '@/components/page';
import { SearchIcon } from '@/components/icons';
import { apiGet } from '@/lib/api-client';
import { buildQuery, first } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Поиск по знаниям',
  description: 'Полнотекстовый поиск по зоопаркам, видам, программам и организациям.',
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = first(sp.q)?.slice(0, 200) ?? '';
  const filters = {
    types: first(sp.types),
    country: first(sp.country),
    iucn: first(sp.iucn),
    programCode: first(sp.programCode),
  };

  let data: SearchResponseDto | null = null;
  let error: string | null = null;

  if (q) {
    try {
      data = await apiGet<SearchResponseDto>(
        '/search' + buildQuery({ q, ...filters, pageSize: 50 }),
      );
    } catch {
      error = 'Не удалось выполнить поиск. Попробуйте ещё раз.';
    }
  }

  const facetLink = (key: 'types' | 'country' | 'iucn' | 'programCode', value: string) => {
    const next = { ...filters, [key]: filters[key] === value ? undefined : value };
    return '/search' + buildQuery({ q, ...next });
  };

  return (
    <>
      <PageHeader
        eyebrow="Поиск"
        title="Поиск по знаниям"
        description="Полнотекстовый поиск с расширением по онтологии и словарю синонимов. Ищет по названиям, описаниям и таксономии."
      />

      <form method="get" action="/search" className="panel flex flex-wrap gap-2" role="search">
        <label htmlFor="search-q" className="sr-only">
          Поисковый запрос
        </label>
        <div className="search-field min-w-[240px] flex-1">
          <SearchIcon size={17} />
          <input
            id="search-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Например: тигр, Прага, EEP, Felidae"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Найти
        </button>
      </form>

      {error ? (
        <p role="alert" className="mt-4 rounded-xl border border-[#ecc9c2] bg-[#fcefec] px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {!q ? (
        <p className="mt-6 text-sm text-muted">
          Введите запрос. Поиск работает по опубликованным знаниям; для пустых результатов предлагаются
          нечёткие подсказки.
        </p>
      ) : null}

      {data ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside aria-label="Фасеты" className="grid content-start gap-3">
            <FacetGroup
              title="Типы"
              items={data.facets.types.map((facet) => ({
                label: typeLabel(facet.value),
                value: facet.value,
                count: facet.count,
                href: facetLink('types', facet.value),
                active: filters.types === facet.value,
              }))}
            />
            <FacetGroup
              title="Страны"
              items={data.facets.countries.map((facet) => ({
                label: facet.label,
                value: facet.value,
                count: facet.count,
                href: facetLink('country', facet.value),
                active: filters.country === facet.value,
              }))}
            />
            <FacetGroup
              title="IUCN"
              items={data.facets.iucn.map((facet) => ({
                label: facet.label,
                value: facet.value,
                count: facet.count,
                href: facetLink('iucn', facet.value),
                active: filters.iucn === facet.value,
              }))}
            />
            <FacetGroup
              title="Программы"
              items={data.facets.programs.map((facet) => ({
                label: facet.label,
                value: facet.value,
                count: facet.count,
                href: facetLink('programCode', facet.value),
                active: filters.programCode === facet.value,
              }))}
            />
          </aside>

          <div>
            <p className="m-0 text-sm text-muted">
              Найдено: {data.total}
              {data.total > data.pageSize ? ` · показаны первые ${data.pageSize}` : ''}
            </p>

            {data.total === 0 ? (
              <div className="empty-state mt-4">
                <p className="m-0 font-medium">По запросу «{q}» ничего не найдено.</p>
                {data.suggestions.length > 0 ? (
                  <>
                    <p className="mb-1 mt-3 text-sm text-muted">Возможно, вы имели в виду:</p>
                    <ul className="m-0 grid list-none gap-1 p-0">
                      {data.suggestions.map((suggestion) => (
                        <li key={suggestion.url}>
                          <Link href={suggestion.url}>{suggestion.title}</Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="mb-0 mt-3 text-sm text-muted">
                    Проверьте написание или попробуйте более общий запрос.
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4 grid gap-6">
                {data.groups.map((group) => (
                  <section key={group.type} aria-labelledby={`group-${group.type}`}>
                    <h2 id={`group-${group.type}`} className="mb-3 text-lg">
                      {group.label}{' '}
                      <span className="text-sm font-normal text-muted">({group.total})</span>
                    </h2>
                    <ul className="grid list-none gap-2 p-0">
                      {group.items.map((item) => (
                        <li key={`${item.type}-${item.id}`} className="panel p-4 transition hover:border-border-strong">
                          <Link href={item.url} className="font-medium">
                            <Highlighted text={item.title} query={q} />
                          </Link>
                          {item.subtitle ? <span className="ml-2 text-sm text-muted">{item.subtitle}</span> : null}

                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

function FacetGroup({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value: string; count: number; href: string; active: boolean }>;
}) {
  if (items.length === 0) return null;
  return (
    <section className="panel p-4">
      <h2 className="m-0 text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted">{title}</h2>
      <ul className="m-0 mt-3 grid list-none gap-1.5 p-0 text-sm">
        {items.map((item) => (
          <li key={item.value}>
            <Link
              href={item.href}
              aria-current={item.active ? 'true' : undefined}
              className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 transition ${
                item.active
                  ? 'bg-accent-weak font-semibold text-accent-strong'
                  : 'text-muted hover:bg-surface-soft hover:text-text'
              }`}
            >
              <span>{item.label}</span>
              <span className="text-xs opacity-70">{item.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Highlighted({ text, query }: { text: string; query: string }) {
  const terms = query
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2);
  if (terms.length === 0) return <>{text}</>;

  const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi');
  const parts = text.split(pattern);
  const termSet = new Set(terms.map((term) => term.toLowerCase()));
  return (
    <>
      {parts.map((part, index) =>
        termSet.has(part.toLowerCase()) ? <mark key={index}>{part}</mark> : <span key={index}>{part}</span>,
      )}
    </>
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    zoo: 'Зоопарки',
    species: 'Виды',
    program: 'Программы',
    country: 'Страны',
    city: 'Города',
    organization: 'Организации',
    research: 'Исследования',
  };
  return labels[type] ?? type;
}

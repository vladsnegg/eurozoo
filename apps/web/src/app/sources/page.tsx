import type { Metadata } from 'next';
import type { SourceDto } from '@eurozoo/shared';
import { FilterForm, SelectField } from '@/components/filter-form';
import { Badge, EmptyState, PageHeader, Pagination } from '@/components/page';
import { first, getList, pageOf } from '@/lib/api';
import { formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Источники',
  description: 'Реестр первоисточников, использованных для проверки сведений базы знаний.',
};

const TYPE_LABELS: Record<string, string> = {
  official_site: 'официальный сайт',
  scientific: 'научная публикация',
  database: 'база данных',
  media: 'СМИ',
  community: 'сообщество',
};

export default async function SourcesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = pageOf(sp.page);
  const filters = { type: first(sp.type), reliability: first(sp.reliability) };
  const sources = await getList<SourceDto>('/sources', { ...filters, page, pageSize: 50 });

  return (
    <>
      <PageHeader
        eyebrow="Провенанс"
        title="Источники"
        description="Каждый опубликованный факт должен опираться на первоисточник с датой проверки."
      />

      <FilterForm action="/sources" resetHref="/sources" total={sources.total}>
        <SelectField
          label="Тип источника"
          name="type"
          value={filters.type}
          options={Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <SelectField
          label="Надёжность"
          name="reliability"
          value={filters.reliability}
          options={[
            { value: 'official', label: 'официальный' },
            { value: 'scientific', label: 'научный' },
            { value: 'database', label: 'база данных' },
            { value: 'media', label: 'СМИ' },
            { value: 'community', label: 'сообщество' },
          ]}
        />
      </FilterForm>

      {sources.items.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Источники не найдены" />
        </div>
      ) : (
        <ul className="mt-6 grid list-none gap-3 p-0">
          {sources.items.map((source) => (
            <li key={source.id} className="panel p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-medium">
                  {source.title}
                </a>
                <Badge tone="info">{TYPE_LABELS[source.type] ?? source.type}</Badge>
              </div>
              <div className="mt-1 text-xs text-muted">
                {source.publisher ?? 'издатель не указан'} · доступ получен {formatDate(source.accessedAt)} ·
                надёжность: {source.reliability}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={sources.page}
        pageSize={sources.pageSize}
        total={sources.total}
        pathname="/sources"
        query={{ ...filters, page: undefined }}
      />
    </>
  );
}

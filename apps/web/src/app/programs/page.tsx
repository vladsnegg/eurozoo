import type { Metadata } from 'next';
import type { ProgramSummaryDto } from '@eurozoo/shared';
import { FilterForm, SelectField } from '@/components/filter-form';
import { EntityCard } from '@/components/knowledge';
import { Badge, EmptyState, PageHeader, Pagination } from '@/components/page';
import { first, getList, pageOf } from '@/lib/api';
import { formatNumber, PROGRAM_CODE_LABELS } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Программы сохранения',
  description: 'Европейские программы сохранения и разведения видов: участники, целевые виды, организации.',
};

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = pageOf(sp.page);
  const filters = {
    code: first(sp.code),
    status: first(sp.status),
  };
  const programs = await getList<ProgramSummaryDto>('/programs', {
    ...filters,
    page,
    pageSize: 24,
  });

  return (
    <>
      <PageHeader
        eyebrow="Сохранение"
        title="Программы сохранения"
        description="EEP, ESB и международные племенные книги."
      />

      <FilterForm action="/programs" resetHref="/programs" total={programs.total}>
        <SelectField
          label="Тип программы"
          name="code"
          value={filters.code}
          options={[
            { value: 'EEP', label: 'EEP — европейская программа разведения' },
            { value: 'ESB', label: 'ESB — европейская племенная книга' },
            { value: 'STUDBOOK', label: 'Международная племенная книга' },
            { value: 'OTHER', label: 'Другое' },
          ]}
        />
        <SelectField
          label="Статус"
          name="status"
          value={filters.status}
          options={[
            { value: 'active', label: 'Активна' },
            { value: 'completed', label: 'Завершена' },
            { value: 'suspended', label: 'Приостановлена' },
          ]}
        />
      </FilterForm>

      {programs.items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Опубликованных программ пока нет"
            description="Программы появятся после проверки источников и публикации."
          />
        </div>
      ) : (
        <ul className="mt-6 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {programs.items.map((program) => (
            <li key={program.id}>
              <EntityCard
                href={`/programs/${program.slug}`}
                type="program"
                title={program.name}
                badge={
                  <Badge tone="accent">
                    {PROGRAM_CODE_LABELS[program.code] ?? program.code}
                  </Badge>
                }
                subtitle={program.organization?.name ?? 'EAZA / Международная координация'}
                meta={
                  <dl className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface-soft px-3 py-2 text-xs">
                    <div>
                      <dt className="font-mono text-[10px] uppercase text-muted">Целевых видов</dt>
                      <dd className="m-0 mt-0.5 font-mono text-sm font-bold text-text">
                        {formatNumber(program.speciesCount)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase text-muted">Зоопарков</dt>
                      <dd className="m-0 mt-0.5 font-mono text-sm font-bold text-accent">
                        {formatNumber(program.zooCount)}
                      </dd>
                    </div>
                  </dl>
                }
              />
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={programs.page}
        pageSize={programs.pageSize}
        total={programs.total}
        pathname="/programs"
        query={{ ...filters, page: undefined }}
      />
    </>
  );
}

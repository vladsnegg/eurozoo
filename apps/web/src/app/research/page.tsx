import type { Metadata } from 'next';
import type { ResearchSummaryDto } from '@eurozoo/shared';
import { FilterForm, SelectField } from '@/components/filter-form';
import { EntityCard } from '@/components/knowledge';
import { EmptyState, PageHeader, Pagination } from '@/components/page';
import { first, getList, pageOf } from '@/lib/api';
import { formatYear } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Исследования',
  description: 'Научные проекты, связанные с зоопарками и видами.',
};

export default async function ResearchListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = pageOf(sp.page);
  const status = first(sp.status);
  const projects = await getList<ResearchSummaryDto>('/research', { status, page, pageSize: 24 });

  return (
    <>
      <PageHeader
        eyebrow="Наука"
        title="Исследования"
        description="Проекты, связанные с зоопарками и изучаемыми видами."
      />

      <FilterForm action="/research" resetHref="/research" total={projects.total}>
        <SelectField
          label="Статус"
          name="status"
          value={status}
          options={[
            { value: 'active', label: 'Активное' },
            { value: 'completed', label: 'Завершённое' },
            { value: 'planned', label: 'Запланированное' },
            { value: 'cancelled', label: 'Отменённое' },
          ]}
        />
      </FilterForm>

      {projects.items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Опубликованных исследований нет"
            description="Проекты появятся после проверки источников."
          />
        </div>
      ) : (
        <ul className="mt-6 grid list-none gap-4 p-0 sm:grid-cols-2">
          {projects.items.map((project) => (
            <li key={project.id}>
              <EntityCard
                href={`/research/${project.slug}`}
                type="research"
                title={project.title}
                subtitle={project.leadOrganization?.name ?? null}
                meta={
                  <span className="text-sm text-muted">
                    {formatYear(project.startedYear)}
                    {project.endedYear ? ` — ${project.endedYear}` : ''} · зоопарков: {project.zooCount} ·
                    видов: {project.speciesCount}
                  </span>
                }
              />
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={projects.page}
        pageSize={projects.pageSize}
        total={projects.total}
        pathname="/research"
        query={{ status, page: undefined }}
      />
    </>
  );
}

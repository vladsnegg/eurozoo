import type { Metadata } from 'next';
import type { OrganizationSummaryDto } from '@eurozoo/shared';
import { FilterForm, SelectField } from '@/components/filter-form';
import { EntityCard } from '@/components/knowledge';
import { EmptyState, PageHeader, Pagination } from '@/components/page';
import { first, getList, pageOf } from '@/lib/api';
import { formatNumber, ORG_TYPE_LABELS } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Организации',
  description: 'Ассоциации, операторы программ и природоохранные организации, связанные с зоопарками.',
};

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = pageOf(sp.page);
  const type = first(sp.type);
  const organizations = await getList<OrganizationSummaryDto>('/organizations', {
    type,
    page,
    pageSize: 24,
  });

  return (
    <>
      <PageHeader
        eyebrow="Партнёры"
        title="Организации"
        description="Ассоциации, операторы программ и исследовательские организации."
      />

      <FilterForm action="/organizations" resetHref="/organizations" total={organizations.total}>
        <SelectField
          label="Тип организации"
          name="type"
          value={type}
          options={Object.entries(ORG_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </FilterForm>

      {organizations.items.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Организации не найдены" />
        </div>
      ) : (
        <ul className="mt-6 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {organizations.items.map((organization) => (
            <li key={organization.id}>
              <EntityCard
                href={`/organizations/${organization.slug}`}
                type="organization"
                title={organization.name}
                subtitle={organization.acronym}
                meta={
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-xs text-muted">Тип</dt>
                      <dd className="m-0">{ORG_TYPE_LABELS[organization.type] ?? organization.type}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Страна</dt>
                      <dd className="m-0">{organization.country?.name ?? 'нет данных'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Зоопарков</dt>
                      <dd className="m-0">{formatNumber(organization.zooCount)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Программ</dt>
                      <dd className="m-0">{formatNumber(organization.programCount)}</dd>
                    </div>
                  </dl>
                }
              />
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={organizations.page}
        pageSize={organizations.pageSize}
        total={organizations.total}
        pathname="/organizations"
        query={{ type, page: undefined }}
      />
    </>
  );
}

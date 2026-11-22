import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RowActions } from '@/components/admin/row-actions';
import { Pagination, PageHeader, Badge } from '@/components/page';
import { SearchIcon } from '@/components/icons';
import { adminResource, type AdminResource } from '@/lib/admin-resources';
import { first, pageOf } from '@/lib/api';
import { serverApi } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

type Row = Record<string, unknown> & { id: string; publishStatus?: string };

const COLUMN_LABELS: Record<string, string> = {
  publishStatus: 'Публикация',
  updatedAt: 'Обновлено',
  accessedAt: 'Доступ',
  publishedAt: 'Дата',
  zooId: 'ID зоопарка',
  createdAt: 'Создано',
  slug: 'Slug',
  iso2: 'ISO2',
  iso3: 'ISO3',
  euMember: 'ЕС',
  lat: 'Широта',
  lng: 'Долгота',
};

const PUBLISH_LABELS: Record<string, string> = {
  draft: 'черновик',
  review: 'на проверке',
  published: 'опубликовано',
};

function columnLabel(config: AdminResource, column: string): string {
  return config.fields.find((field) => field.name === column)?.label ?? COLUMN_LABELS[column] ?? column;
}

function renderValue(column: string, value: unknown) {
  if (column === 'publishStatus' && typeof value === 'string') {
    return (
      <Badge tone={value === 'published' ? 'accent' : value === 'review' ? 'warning' : 'neutral'}>
        {PUBLISH_LABELS[value] ?? value}
      </Badge>
    );
  }
  if (typeof value === 'boolean') return value ? 'да' : 'нет';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value).toLocaleDateString('ru-RU');
  }
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

export default async function AdminResourcePage({
  params,
  searchParams,
}: {
  params: Promise<{ resource: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { resource } = await params;
  const config = adminResource(resource);
  if (!config) notFound();

  const sp = await searchParams;
  const page = pageOf(sp.page);
  const q = first(sp.q);

  const [list, me] = await Promise.all([
    serverApi<{ items: Row[]; total: number; page: number; pageSize: number }>(
      `/admin/${resource}?page=${page}&pageSize=20${q ? `&q=${encodeURIComponent(q)}` : ''}`,
    ),
    serverApi<{ user: { role: string } }>('/auth/me'),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Куратор"
        title={config.label}
        description={`Всего записей: ${list.total}`}
        actions={
          <Link href={`/admin/${resource}/new`} className="btn btn-primary btn-sm">
            Добавить
          </Link>
        }
      />

      <form method="get" className="mb-4 flex flex-wrap gap-2" role="search">
        <div className="search-field w-full max-w-xs">
          <SearchIcon size={16} />
          <input name="q" defaultValue={q ?? ''} placeholder="Поиск" />
        </div>
        <button type="submit" className="btn btn-outline btn-sm">
          Найти
        </button>
      </form>

      {list.items.length === 0 ? (
        <p className="empty-state text-sm text-muted">Записей нет.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <caption className="sr-only">Список записей: {config.label}</caption>
            <thead>
              <tr>
                {config.listColumns.map((column) => (
                  <th key={column} scope="col">
                    {columnLabel(config, column)}
                  </th>
                ))}
                <th scope="col">Действия</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((row) => (
                <tr key={row.id}>
                  {config.listColumns.map((column) => (
                    <td key={column} className="max-w-[280px] truncate">
                      {renderValue(column, row[column])}
                    </td>
                  ))}
                  <td>
                    <RowActions
                      resource={resource}
                      id={row.id}
                      publishable={Boolean(config.publishable)}
                      canDelete={me.user.role === 'admin'}
                      published={row.publishStatus === 'published'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={list.page}
        pageSize={list.pageSize}
        total={list.total}
        pathname={`/admin/${resource}`}
        query={{ q, page: undefined }}
      />
    </>
  );
}

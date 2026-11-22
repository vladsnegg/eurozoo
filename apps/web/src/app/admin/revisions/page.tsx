import { PageHeader, Pagination } from '@/components/page';
import { first, pageOf } from '@/lib/api';
import { serverApi } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

type Revision = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  createdAt: string;
  actor: { email: string } | null;
  diff: unknown;
};

export default async function AdminRevisionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = pageOf(sp.page);
  const list = await serverApi<{ items: Revision[]; total: number; page: number; pageSize: number }>(
    `/admin/revisions?page=${page}&pageSize=30`,
  );

  return (
    <>
      <PageHeader
        eyebrow="Куратор"
        title="Журнал изменений"
        description="Кто, что и когда изменил."
      />

      {list.items.length === 0 ? (
        <p className="text-sm text-muted">Изменений пока нет.</p>
      ) : (
        <ul className="m-0 grid list-none gap-2 p-0">
          {list.items.map((item) => (
            <li key={item.id} className="panel p-4 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="font-medium">
                  {item.entityType} · {item.action}
                </span>
                <span className="text-xs text-muted">
                  {new Date(item.createdAt).toLocaleString('ru-RU')} · {item.actor?.email ?? 'система'}
                </span>
              </div>
              <p className="m-0 mt-1 text-xs text-muted">id: {item.entityId}</p>
              <pre className="m-0 mt-2 max-h-24 overflow-auto rounded-xl border border-border bg-surface-soft p-3 text-xs">
                {JSON.stringify(item.diff, null, 2)}
              </pre>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={list.page}
        pageSize={list.pageSize}
        total={list.total}
        pathname="/admin/revisions"
        query={{ page: first(sp.page) }}
      />
    </>
  );
}

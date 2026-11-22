import Link from 'next/link';
import { PageHeader } from '@/components/page';
import { serverApi } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

const MODEL_LABELS: Record<string, string> = {
  zoo: 'Зоопарки',
  taxon: 'Таксоны',
  source: 'Источники',
  conservationProgram: 'Программы',
  organization: 'Организации',
  researchProject: 'Исследования',
  knowledgeEdge: 'Связи',
  appUser: 'Пользователи',
  searchSynonym: 'Синонимы',
};

type Dashboard = {
  counts: Array<{ model: string; count: number }>;
  zoos: { draft: number; published: number; missingSources: number };
  stale: number;
  recent: Array<{
    id: string;
    entityType: string;
    action: string;
    createdAt: string;
    actor: { email: string } | null;
  }>;
};

export default async function AdminDashboardPage() {
  const data = await serverApi<Dashboard>('/admin/dashboard');

  return (
    <>
      <PageHeader eyebrow="Куратор" title="Дашборд" description="Состояние данных и последние изменения." />

      <dl className="stat-grid">
        {data.counts.map((item) => (
          <div key={item.model} className="stat">
            <span>{MODEL_LABELS[item.model] ?? item.model}</span>
            <b>{item.count}</b>
          </div>
        ))}
      </dl>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="panel p-5">
          <p className="meta-label">Опубликовано зоопарков</p>
          <p className="m-0 mt-1 text-2xl font-semibold">{data.zoos.published}</p>
        </div>
        <div className="panel p-5">
          <p className="meta-label">Черновики</p>
          <p className="m-0 mt-1 text-2xl font-semibold">{data.zoos.draft}</p>
        </div>
        <div className="panel p-5">
          <p className="meta-label">Без проверенного источника</p>
          <p className={`m-0 mt-1 text-2xl font-semibold ${data.zoos.missingSources > 0 ? 'text-danger' : ''}`}>
            {data.zoos.missingSources}
          </p>
        </div>
      </div>

      {data.stale > 0 ? (
        <p className="notice mt-4">
          Просроченный провенанс: {data.stale}. Запустите <code>pnpm data:stale</code> для отчёта.
        </p>
      ) : null}

      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="m-0 text-xl">Последние изменения</h2>
          <Link href="/admin/revisions" className="text-sm">
            Весь журнал →
          </Link>
        </div>
        {data.recent.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Изменений пока нет.</p>
        ) : (
          <ul className="m-0 mt-2 grid list-none gap-1 p-0 text-sm">
            {data.recent.map((item) => (
              <li key={item.id}>
                <span className="font-medium">{item.entityType}</span> · {item.action} ·{' '}
                {new Date(item.createdAt).toLocaleString('ru-RU')} ·{' '}
                {item.actor?.email ?? 'система'}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

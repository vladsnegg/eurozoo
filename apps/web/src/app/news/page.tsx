import type { Metadata } from 'next';
import Link from 'next/link';
import type { NewsSummaryDto, ZooSummaryDto } from '@eurozoo/shared';
import { NewsCard } from '@/components/news-card';
import { EmptyState, PageHeader, Pagination } from '@/components/page';
import { first, getList, pageOf, safeList } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Новости зоопарков',
  description: 'Актуальные новости европейских зоопарков из официальных источников.',
};

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = pageOf(sp.page);
  const zoo = first(sp.zoo);

  const [news, zoos] = await Promise.all([
    getList<NewsSummaryDto>('/news', { zoo, page, pageSize: 12 }),
    safeList<ZooSummaryDto>('/zoos', { pageSize: 1000 }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Новости"
        title="Новости зоопарков"
        description="Актуальные обновления из официальных источников."
      />

      <form method="get" action="/news" className="filter-panel news-filter">
        <label className="field" htmlFor="news-zoo">
          <span>Зоопарк</span>
          <select id="news-zoo" name="zoo" defaultValue={zoo ?? ''} className="select">
            <option value="">Все зоопарки</option>
            {zoos.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-primary btn-sm">
          Применить
        </button>
        <Link href="/news" className="text-sm font-semibold text-muted hover:text-accent">
          Сбросить
        </Link>
      </form>

      {news.items.length === 0 ? (
        <EmptyState
          title="Новостей пока нет"
          description="Выберите другого зоопарка или загляните позже."
        />
      ) : (
        <ul className="mt-6 grid list-none gap-4 p-0 lg:grid-cols-2">
          {news.items.map((item) => (
            <li key={item.id}>
              <NewsCard item={item} />
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={news.page}
        pageSize={news.pageSize}
        total={news.total}
        pathname="/news"
        query={{ zoo, page: undefined }}
      />
    </>
  );
}

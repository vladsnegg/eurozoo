import type { Metadata } from 'next';
import Link from 'next/link';
import type { TaxonLineageDto, TaxonNodeDto } from '@eurozoo/shared';
import { EntityCard, LineageTrail } from '@/components/knowledge';
import { Breadcrumbs, EmptyState, PageHeader, Pagination } from '@/components/page';
import { pageOf, first, getList, getOne } from '@/lib/api';
import { rethrowNotFound } from '@/lib/not-found';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ rank: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const node = await getOne<TaxonNodeDto>(`/taxa/slug/${slug}`);
    return {
      title: node.scientificName,
      description: `${node.scientificName} — ${node.rank.nameRu} в таксономии EuroZoo Atlas.`,
    };
  } catch (error) {
    rethrowNotFound(error);
    return { title: 'Таксон не найден' };
  }
}

export default async function TaxonPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = pageOf(sp.page);
  const node = await getOne<TaxonNodeDto>(`/taxa/slug/${slug}`);
  const [children, lineage] = await Promise.all([
    getList<TaxonNodeDto>(`/taxa/${node.id}/children`, { page, pageSize: 24 }),
    getOne<TaxonLineageDto>(`/taxa/${node.id}/lineage`),
  ]);

  return (
    <>
      <Breadcrumbs
        items={[
          { href: '/', label: 'Главная' },
          { href: '/taxonomy', label: 'Таксономия' },
          { label: node.scientificName },
        ]}
      />

      <PageHeader
        title={node.scientificName}
        description={[node.commonNameRu, node.rank.nameRu].filter(Boolean).join(' · ')}
        actions={
          node.rank.code === 'species' ? (
            <Link href={`/species/${node.slug}`} className="text-sm">
              Открыть карточку вида →
            </Link>
          ) : undefined
        }
      />

      <div className="rounded-[var(--radius)] border border-border bg-surface p-4">
        <LineageTrail items={lineage.items} />
      </div>

      <h2 className="mt-8 text-2xl">Дочерние таксоны</h2>
      {children.items.length === 0 ? (
        <div className="mt-3">
          <EmptyState title="Дочерних таксонов нет" description="Это конечный узел дерева." />
        </div>
      ) : (
        <ul className="mt-4 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {children.items.map((child) => (
            <li key={child.id}>
              <EntityCard
                href={
                  child.rank.code === 'species'
                    ? `/species/${child.slug}`
                    : `/taxonomy/${child.rank.code}/${child.slug}`
                }
                type="taxon"
                title={child.scientificName}
                italicTitle
                subtitle={child.commonNameRu}
                meta={
                  <span className="text-sm text-muted">
                    {child.rank.nameRu} · дочерних: {child.childrenCount}
                  </span>
                }
              />
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={children.page}
        pageSize={children.pageSize}
        total={children.total}
        pathname={`/taxonomy/${node.rank.code}/${node.slug}`}
        query={{ page: first(sp.page) }}
      />
    </>
  );
}

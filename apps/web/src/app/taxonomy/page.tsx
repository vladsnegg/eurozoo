import type { Metadata } from 'next';
import Link from 'next/link';
import type { TaxonNodeDto } from '@eurozoo/shared';
import { EntityCard } from '@/components/knowledge';
import { EmptyState, PageHeader } from '@/components/page';
import { first, safeArray } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Таксономия',
  description: 'Иерархия биологической классификации видов, представленных в базе знаний.',
};

const RANKS: Array<{ code: string; label: string }> = [
  { code: 'kingdom', label: 'Царство' },
  { code: 'phylum', label: 'Тип' },
  { code: 'class', label: 'Класс' },
  { code: 'order', label: 'Отряд' },
  { code: 'family', label: 'Семейство' },
  { code: 'genus', label: 'Род' },
  { code: 'species', label: 'Вид' },
];

export default async function TaxonomyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const rank = first(sp.rank) ?? 'class';
  const current = RANKS.find((item) => item.code === rank) ?? RANKS[2]!;
  const taxa = await safeArray<TaxonNodeDto>('/taxonomy', { rank: current.code });

  return (
    <>
      <PageHeader
        eyebrow="Классификация"
        title="Таксономия"
        description="Дерево классификации: от царства до вида. Выберите ранг и перейдите к узлу, чтобы увидеть дочерние таксоны."
      />

      <nav aria-label="Ранги таксономии" className="tag-list mb-6">
        {RANKS.map((item) => (
          <Link
            key={item.code}
            href={`/taxonomy?rank=${item.code}`}
            className={
              item.code === current.code
                ? '!border-accent !bg-accent-weak !text-accent'
                : ''
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {taxa.length === 0 ? (
        <EmptyState title="Таксоны этого ранга не найдены" description="Выберите другой ранг." />
      ) : (
        <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {taxa.map((node) => (
            <li key={node.id}>
              <EntityCard
                href={
                  node.rank.code === 'species'
                    ? `/species/${node.slug}`
                    : `/taxonomy/${node.rank.code}/${node.slug}`
                }
                type="taxon"
                title={node.scientificName}
                italicTitle
                subtitle={node.commonNameRu}
                meta={
                  <span className="text-sm text-muted">
                    {node.rank.nameRu} · дочерних таксонов: {node.childrenCount}
                  </span>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

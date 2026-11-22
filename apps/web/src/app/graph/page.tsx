import type { Metadata } from 'next';
import { GraphView } from '@/components/graph/graph-view';
import { PageHeader } from '@/components/page';
import { apiGet } from '@/lib/api-client';
import { buildQuery, first } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Граф знаний',
  description: 'Исследование связей между зоопарками, видами, таксонами, городами и программами.',
};

type Predicate = { code: string; labelRu: string };

export default async function GraphPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const seedParam = first(sp.seed);
  const match = seedParam?.match(
    /^(zoo|species|taxon|country|city|program|organization|research):([0-9a-f-]{36})$/i,
  );
  const initialSeed = match ? { type: match[1] as string, id: match[2] as string } : null;

  let predicates: Predicate[] = [];
  try {
    predicates = await apiGet<Predicate[]>('/graph/predicates');
  } catch {
    predicates = [];
  }

  return (
    <>
      <PageHeader
        eyebrow="Связи"
        title="Граф знаний"
        description="Связи строятся по опубликованным данным. Выведенные связи показаны пунктиром и требуют проверки."
      />
      <GraphView initialSeed={initialSeed} predicates={predicates} />
      {initialSeed ? (
        <p className="mt-4 text-sm text-muted">
          Ссылка для обмена:{' '}
          <code>
            /graph{buildQuery({ seed: `${initialSeed.type}:${initialSeed.id}`, depth: first(sp.depth) ?? 2 })}
          </code>
        </p>
      ) : null}
    </>
  );
}

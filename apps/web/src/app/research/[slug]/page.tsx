import type { Metadata } from 'next';
import Link from 'next/link';
import type { ResearchDetailDto } from '@eurozoo/shared';
import { Breadcrumbs, EmptyState, Meta, PageHeader, Section } from '@/components/page';
import { SourceList } from '@/components/knowledge';
import { getOne } from '@/lib/api';
import { RelatedPanel } from '@/components/related-panel';
import { rethrowNotFound } from '@/lib/not-found';
import { formatYear } from '@/lib/format';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const project = await getOne<ResearchDetailDto>(`/research/${slug}`);
    return {
      title: project.title,
      description: project.summary ?? `${project.title} — исследовательский проект.`,
    };
  } catch (error) {
    rethrowNotFound(error);
    return { title: 'Исследование не найдено' };
  }
}

export default async function ResearchPage({ params }: Props) {
  const { slug } = await params;
  const project = await getOne<ResearchDetailDto>(`/research/${slug}`);

  return (
    <>
      <Breadcrumbs
        items={[
          { href: '/', label: 'Главная' },
          { href: '/research', label: 'Исследования' },
          { label: project.title },
        ]}
      />
      <PageHeader
        eyebrow="Исследование"
        title={project.title}
        description={project.leadOrganization?.name ?? undefined}
      />

      <dl className="meta-grid">
        <Meta label="Статус" value={project.status} />
        <Meta
          label="Период"
          value={`${formatYear(project.startedYear)}${project.endedYear ? ` — ${project.endedYear}` : ''}`}
        />
        <Meta label="Зоопарков" value={project.zoos.length} />
        <Meta label="Видов" value={project.species.length} />
      </dl>

      <Section title="Описание" id="about">
        <p className="max-w-[72ch]">{project.summary ?? 'Описание не заполнено.'}</p>
      </Section>

      <Section title="Зоопарки" id="zoos">
        {project.zoos.length === 0 ? (
          <EmptyState title="Зоопарки не указаны" />
        ) : (
          <ul className="grid list-none gap-2 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {project.zoos.map((zoo) => (
              <li key={zoo.id} className="panel p-4">
                <Link href={`/zoos/${zoo.slug}`}>{zoo.name}</Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Изучаемые виды" id="species">
        {project.species.length === 0 ? (
          <p className="text-sm text-muted">Виды не указаны.</p>
        ) : (
          <ul className="grid list-none gap-2 p-0 sm:grid-cols-2">
            {project.species.map((species) => (
              <li key={species.id}>
                <Link href={`/species/${species.slug}`} className="italic">
                  {species.scientificName}
                </Link>
                {species.commonNameRu ? (
                  <span className="ml-2 text-xs text-muted">{species.commonNameRu}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <RelatedPanel type="research" id={project.id} />

      <Section title="Источники" id="sources">
        <SourceList items={project.provenance} />
      </Section>
    </>
  );
}

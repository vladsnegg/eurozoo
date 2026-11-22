import type { Metadata } from 'next';
import Link from 'next/link';
import type { OrganizationDetailDto } from '@eurozoo/shared';
import { Breadcrumbs, EmptyState, Meta, PageHeader, Section } from '@/components/page';
import { getOne } from '@/lib/api';
import { RelatedPanel } from '@/components/related-panel';
import { rethrowNotFound } from '@/lib/not-found';
import { formatYear, ORG_TYPE_LABELS, PROGRAM_CODE_LABELS } from '@/lib/format';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const org = await getOne<OrganizationDetailDto>(`/organizations/${slug}`);
    return {
      title: org.name,
      description: org.description ?? `${org.name} — организация в базе знаний EuroZoo Atlas.`,
    };
  } catch (error) {
    rethrowNotFound(error);
    return { title: 'Организация не найдена' };
  }
}

export default async function OrganizationPage({ params }: Props) {
  const { slug } = await params;
  const org = await getOne<OrganizationDetailDto>(`/organizations/${slug}`);

  return (
    <>
      <Breadcrumbs
        items={[
          { href: '/', label: 'Главная' },
          { href: '/organizations', label: 'Организации' },
          { label: org.acronym ?? org.name },
        ]}
      />
      <PageHeader
        eyebrow="Организация"
        title={org.name}
        description={org.acronym ?? undefined}
        actions={
          org.website ? (
            <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-sm">
              Сайт ↗
            </a>
          ) : undefined
        }
      />

      <dl className="meta-grid">
        <Meta label="Тип" value={ORG_TYPE_LABELS[org.type] ?? org.type} />
        <Meta label="Страна" value={org.country?.name ?? 'нет данных'} />
        <Meta label="Основана" value={formatYear(org.foundedYear)} />
        <Meta label="Зоопарков-членов" value={org.zoos.length} />
      </dl>

      <Section title="Об организации" id="about">
        <p className="max-w-[72ch]">{org.description ?? 'Описание не заполнено.'}</p>
      </Section>

      <Section title="Программы" id="programs">
        {org.programs.length === 0 ? (
          <p className="text-sm text-muted">Программы не указаны.</p>
        ) : (
          <ul className="grid list-none gap-2 p-0">
            {org.programs.map((program) => (
              <li key={program.id}>
                <Link href={`/programs/${program.slug}`}>{program.name}</Link>
                <span className="ml-2 text-xs text-muted">
                  {PROGRAM_CODE_LABELS[program.code] ?? program.code}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Зоопарки-члены" id="zoos">
        {org.zoos.length === 0 ? (
          <EmptyState title="Список членов не подтверждён" />
        ) : (
          <ul className="grid list-none gap-2 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {org.zoos.map((link) => (
              <li key={link.zoo.id} className="panel p-4 text-sm">
                <Link href={`/zoos/${link.zoo.slug}`}>{link.zoo.name}</Link>
                {link.role ? <div className="text-xs text-muted">{link.role}</div> : null}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Исследования" id="research">
        {org.research.length === 0 ? (
          <p className="text-sm text-muted">Исследования не указаны.</p>
        ) : (
          <ul className="grid list-none gap-2 p-0">
            {org.research.map((project) => (
              <li key={project.id}>
                <Link href={`/research/${project.slug}`}>{project.title}</Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <RelatedPanel type="organization" id={org.id} />

      <Section title="Источники" id="sources">
        {org.sources.length === 0 ? (
          <p className="text-sm text-muted">Источники не указаны.</p>
        ) : (
          <ul className="grid list-none gap-2 p-0">
            {org.sources.map((source) => (
              <li key={source.id} className="text-sm">
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.title}
                </a>
                <span className="ml-2 text-xs text-muted">{source.reliability}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}

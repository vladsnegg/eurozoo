import type { Metadata } from 'next';
import Link from 'next/link';
import type { ProgramDetailDto } from '@eurozoo/shared';
import { NetworkIcon } from '@/components/icons';
import { IucnBadge, SourceList } from '@/components/knowledge';
import { Breadcrumbs, DataTable, EmptyState, Section } from '@/components/page';
import { getOne } from '@/lib/api';
import { RelatedPanel } from '@/components/related-panel';
import { PARTICIPATION_LABELS, PROGRAM_CODE_LABELS } from '@/lib/format';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const program = await getOne<ProgramDetailDto>(`/programs/${slug}`);
  return {
    title: program.name,
    description: `${program.name} — европейская программа сохранения вида в базе EuroZoo Atlas.`,
    alternates: { canonical: `/programs/${program.slug}` },
  };
}

export default async function ProgramDetailPage({ params }: Props) {
  const { slug } = await params;
  const program = await getOne<ProgramDetailDto>(`/programs/${slug}`);

  const periodLabel = program.startedYear
    ? `${program.startedYear}${program.endedYear ? ` — ${program.endedYear}` : ' — н. в.'}`
    : 'действующая программа';

  return (
    <>
      <Breadcrumbs
        items={[
          { href: '/', label: 'Главная' },
          { href: '/programs', label: 'Программы' },
          { label: program.name },
        ]}
      />

      <section className="specimen-hero rise">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="hero-eyebrow">
                CONSERVATION // {PROGRAM_CODE_LABELS[program.code] ?? program.code}
              </span>
              <span className="hero-eyebrow-mono">{program.status.toUpperCase()}</span>
            </div>

            <h1 className="mt-4 mb-1 text-white">{program.name}</h1>
            {program.organization ? (
              <p className="m-0 text-base text-white/70">
                Оператор:{' '}
                <Link
                  href={`/organizations/${program.organization.slug}`}
                  className="font-semibold text-[#c8f560] hover:underline"
                >
                  {program.organization.name}
                </Link>
              </p>
            ) : null}
          </div>

          <Link
            href={`/graph?seed=program:${program.id}&depth=2`}
            className="btn btn-primary btn-sm"
          >
            <NetworkIcon size={15} />
            <span>В графе знаний</span>
          </Link>
        </div>

        {program.description ? (
          <p className="mt-5 max-w-[74ch] text-base leading-relaxed text-white/80">
            {program.description}
          </p>
        ) : null}

        <dl className="specimen-hero-metrics">
          <div>
            <dt>Код стандарта</dt>
            <dd className="font-mono">{PROGRAM_CODE_LABELS[program.code] ?? program.code}</dd>
          </div>
          <div>
            <dt>Статус / период</dt>
            <dd className="font-mono">{periodLabel}</dd>
          </div>
          <div>
            <dt>Целевых видов</dt>
            <dd className="font-mono text-[#c8f560]">{program.species.length}</dd>
          </div>
          <div>
            <dt>Зоопарков-участников</dt>
            <dd className="font-mono">{program.zoos.length}</dd>
          </div>
        </dl>
      </section>

      <Section title="Целевые биологические виды" id="species">
        {program.species.length === 0 ? (
          <EmptyState title="Целевые виды не указаны" />
        ) : (
          <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
            {program.species.map((entry) => (
              <li
                key={entry.taxon.id}
                className="panel flex flex-wrap items-center justify-between gap-3 p-5"
              >
                <div>
                  <Link
                    href={`/species/${entry.taxon.slug}`}
                    className="font-serif text-2xl font-semibold italic text-text hover:text-accent"
                  >
                    {entry.taxon.scientificName}
                  </Link>
                  {entry.taxon.commonNameRu ? (
                    <div className="mt-0.5 text-sm text-muted">{entry.taxon.commonNameRu}</div>
                  ) : null}
                </div>
                <IucnBadge iucn={entry.taxon.iucn} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title={`Участники (${program.zoos.length})`}
        id="zoos"
      >
        {program.zoos.length === 0 ? (
          <EmptyState
            title="Участники не подтверждены"
            description="Список публикуется только при наличии источника."
          />
        ) : (
          <DataTable
            caption="Зоопарки-участники"
            head={['Зоопарк', 'Город и страна', 'Роль в программе']}
          >
            {program.zoos.map((entry) => (
              <tr key={entry.zoo.id}>
                <td>
                  <Link
                    href={`/zoos/${entry.zoo.slug}`}
                    className="font-bold text-text hover:text-accent"
                  >
                    {entry.zoo.name}
                  </Link>
                </td>
                <td>
                  <span className="mr-2 rounded bg-surface-soft px-1.5 py-0.5 font-mono text-[10.5px] font-bold text-muted">
                    {entry.zoo.city.country.iso2}
                  </span>
                  {entry.zoo.city.name}, {entry.zoo.city.country.name}
                </td>
                <td className="font-mono text-xs text-muted">
                  {PARTICIPATION_LABELS[entry.role] ?? entry.role}
                  {entry.sinceYear ? ` · с ${entry.sinceYear}` : ''}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Section>

      <RelatedPanel type="program" id={program.id} />

      <Section title="Источники и провенанс" id="sources">
        <SourceList items={program.provenance} />
      </Section>
    </>
  );
}

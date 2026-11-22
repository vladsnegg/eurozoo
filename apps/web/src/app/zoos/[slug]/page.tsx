import type { Metadata } from 'next';
import Link from 'next/link';
import type { NewsSummaryDto, ZooDetailDto, ZooSummaryDto } from '@eurozoo/shared';
import { EuropeAtlasMap } from '@/components/europe-atlas-map';
import { ArrowRightIcon, ArrowUpRightIcon, NetworkIcon, ShieldIcon } from '@/components/icons';
import { IucnBadge, SourceBadges, SourceList } from '@/components/knowledge';
import { NewsCard } from '@/components/news-card';
import { Badge, Breadcrumbs, DataTable, EmptyState, Section } from '@/components/page';
import { getOne, safeList } from '@/lib/api';
import { CountryFlag } from '@/components/country-flag';
import { RelatedPanel } from '@/components/related-panel';
import {
  AUDIENCE_LABELS,
  FORMAT_LABELS,
  formatCoord,
  formatNumber,
  formatYear,
  PARTICIPATION_LABELS,
  PROGRAM_CODE_LABELS,
} from '@/lib/format';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const zoo = await getOne<ZooDetailDto>(`/zoos/${slug}`);
  return {
    title: zoo.name,
    description: `${zoo.name} — ${zoo.city.name}, ${zoo.locationLabel ?? zoo.city.country.name}. Карточка зоопарка в базе знаний EuroZoo Atlas.`,
    alternates: { canonical: `/zoos/${zoo.slug}` },
  };
}

export default async function ZooPage({ params }: Props) {
  const { slug } = await params;
  const [zoo, allZoos, news] = await Promise.all([
    getOne<ZooDetailDto>(`/zoos/${slug}`),
    safeList<ZooSummaryDto>('/zoos', { pageSize: 1000 }),
    safeList<NewsSummaryDto>('/news', { zoo: slug, pageSize: 4 }),
  ]);

  const mapPoints = allZoos.map((z) => ({
    slug: z.slug,
    name: z.name,
    city: z.city.name,
    country: z.locationLabel ?? z.city.country.name,
    iso2: z.city.country.iso2,
    neutral: z.locationLabel === 'Крым',
    foundedYear: z.foundedYear,
    speciesCount: z.speciesCount,
    lat: z.lat,
    lng: z.lng,
  }));

  return (
    <>
      <Breadcrumbs
        items={[
          { href: '/', label: 'Главная' },
          { href: '/zoos', label: 'Зоопарки' },
          zoo.locationLabel
            ? { label: zoo.locationLabel }
            : { href: `/countries/${zoo.city.country.slug}`, label: zoo.city.country.name },
          { label: zoo.name },
        ]}
      />

      {/* Editorial Dark Specimen Banner */}
      <section className="specimen-hero rise">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="hero-eyebrow">
                {zoo.locationLabel ? null : <CountryFlag iso2={zoo.city.country.iso2} size={16} />}
                ZOO // {zoo.locationLabel?.toUpperCase() ?? zoo.city.country.iso2} ·{' '}
                {zoo.city.name.toUpperCase()}
              </span>
              {zoo.foundedYear ? (
                <span className="hero-eyebrow-mono">EST. {zoo.foundedYear}</span>
              ) : null}
              <span className="hero-eyebrow-mono">{formatCoord(zoo.lat, zoo.lng)}</span>
            </div>

            <h1 className="mt-4 mb-1 text-white">{zoo.name}</h1>
            {zoo.nameLocal && zoo.nameLocal !== zoo.name ? (
              <p className="m-0 font-serif text-xl italic text-white/70">{zoo.nameLocal}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {zoo.website ? (
              <a
                href={zoo.website}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
              >
                <span>Официальный сайт</span>
                <ArrowUpRightIcon size={15} />
              </a>
            ) : null}
            <Link href={`/graph?seed=zoo:${zoo.id}&depth=2`} className="btn btn-ghost btn-sm">
              <NetworkIcon size={15} />
              <span>В графе знаний</span>
            </Link>
          </div>
        </div>

        {zoo.description ? (
          <p className="mt-5 max-w-[74ch] text-base leading-relaxed text-white/80">
            {zoo.description}
          </p>
        ) : null}

        <dl className="specimen-hero-metrics">
          <div>
            <dt>Локация</dt>
            <dd>
              <Link href={`/cities/${zoo.city.slug}`} className="text-white hover:text-[#c8f560]">
                {zoo.city.name}
              </Link>
              ,{' '}
              {zoo.locationLabel ? (
                <span className="text-white/75">{zoo.locationLabel}</span>
              ) : (
                <>
                  <CountryFlag iso2={zoo.city.country.iso2} size={16} />{' '}
                  <Link
                    href={`/countries/${zoo.city.country.slug}`}
                    className="text-white/75 hover:text-[#c8f560]"
                  >
                    {zoo.city.country.name}
                  </Link>
                </>
              )}
            </dd>
          </div>
          <div>
            <dt>Год основания</dt>
            <dd className="font-mono">{formatYear(zoo.foundedYear)}</dd>
          </div>
          <div>
            <dt>Видов в атласе</dt>
            <dd className="font-mono text-[#c8f560]">{zoo.species.length}</dd>
          </div>
          <div>
            <dt>Программ / источников</dt>
            <dd className="font-mono">
              {zoo.programs.length} прогр. · {zoo.provenance.length} источн.
            </dd>
          </div>
        </dl>
      </section>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <Section
            title="Новости"
            id="news"
            actions={
              <Link href={`/news?zoo=${zoo.slug}`} className="link-arrow">
                Все новости <ArrowRightIcon size={14} />
              </Link>
            }
          >
            {news.length === 0 ? (
              <p className="panel p-4 text-sm text-muted">Новостей пока нет.</p>
            ) : (
              <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
                {news.map((item) => (
                  <li key={item.id}>
                    <NewsCard item={item} />
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section
            title="Видовая коллекция"
            id="species"
            actions={
              zoo.provenance.length > 0 ? <SourceBadges items={zoo.provenance} /> : undefined
            }
          >
            {zoo.species.length === 0 ? (
              <EmptyState
                title="Нет подтверждённых видов"
                description="Виды добавляются только по официальной странице зоопарка."
              />
            ) : (
              <DataTable
                caption="Виды в зоопарке"
                head={['Биологический вид', 'Категория IUCN', 'Учёт / разведение']}
              >
                {zoo.species.map((entry) => (
                  <tr key={entry.taxon.id}>
                    <td>
                      <Link
                        href={`/species/${entry.taxon.slug}`}
                        className="font-serif text-lg font-semibold italic text-text hover:text-accent"
                      >
                        {entry.taxon.scientificName}
                      </Link>
                      {entry.taxon.commonNameRu ? (
                        <div className="text-xs font-medium text-muted">
                          {entry.taxon.commonNameRu}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <IucnBadge iucn={entry.taxon.iucn} />
                    </td>
                    <td className="font-mono text-xs text-muted">
                      {entry.totalCount !== null
                        ? `${formatNumber(entry.totalCount)} особ.`
                        : entry.breeding
                          ? 'размножается'
                          : 'подтверждено в коллекции'}
                    </td>
                  </tr>
                ))}
              </DataTable>
            )}
          </Section>

          <Section title="Программы сохранения" id="programs">
            {zoo.programs.length === 0 ? (
              <p className="panel p-4 text-sm text-muted">Нет подтверждённых программ.</p>
            ) : (
              <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
                {zoo.programs.map((program) => (
                  <li key={program.id} className="panel flex flex-col justify-between p-4">
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone="accent">
                        {PROGRAM_CODE_LABELS[program.code] ?? program.code}
                      </Badge>
                      <span className="font-mono text-[11px] text-muted">
                        {PARTICIPATION_LABELS[program.role] ?? program.role}
                        {program.sinceYear ? ` · с ${program.sinceYear}` : ''}
                      </span>
                    </div>
                    <Link
                      href={`/programs/${program.slug}`}
                      className="mt-2.5 block text-base font-bold text-text hover:text-accent"
                    >
                      {program.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {zoo.research.length > 0 ? (
            <Section title="Научные и полевые проекты" id="research">
              <ul className="m-0 grid list-none gap-3 p-0">
                {zoo.research.map((project) => (
                  <li
                    key={project.id}
                    className="panel flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <Link
                      href={`/research/${project.slug}`}
                      className="font-semibold text-text hover:text-accent"
                    >
                      {project.title}
                    </Link>
                    <Badge tone="info">{project.status}</Badge>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {zoo.education.length > 0 ? (
            <Section title="Образовательные программы" id="education">
              <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
                {zoo.education.map((program) => (
                  <li key={program.id} className="panel p-4 text-sm">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone="neutral">
                        {AUDIENCE_LABELS[program.audience] ?? program.audience}
                      </Badge>
                      <Badge tone="info">{FORMAT_LABELS[program.format] ?? program.format}</Badge>
                    </div>
                    <strong className="mt-2.5 block text-base">{program.title}</strong>
                    {program.url ? (
                      <a
                        href={program.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold"
                      >
                        Страница программы <ArrowUpRightIcon size={12} />
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {zoo.organizations.length > 0 ? (
            <Section title="Членство в организациях" id="organizations">
              <ul className="tag-list">
                {zoo.organizations.map((organization) => (
                  <li key={organization.id}>
                    <Link href={`/organizations/${organization.slug}`}>
                      {organization.acronym ?? organization.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          <RelatedPanel type="zoo" id={zoo.id} />

          <Section title="Источники" id="sources">
            <SourceList items={zoo.provenance} />
          </Section>
        </div>

        {/* Sticky Telemetry & Locator Sidebar */}
        <aside className="grid gap-4 lg:sticky lg:top-28">
          <EuropeAtlasMap zoos={mapPoints} activeSlug={zoo.slug} compact />

          <div className="panel p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-muted">
                ПАСПОРТ ОБЪЕКТА
              </span>
              <span className="badge badge-accent font-mono text-[10px]">
                <ShieldIcon size={12} /> VERIFIED
              </span>
            </div>

            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex items-baseline justify-between border-b border-dashed border-border pb-2">
                <dt className="text-xs text-muted">Slug</dt>
                <dd className="m-0 font-mono text-xs font-semibold">{zoo.slug}</dd>
              </div>
              <div className="flex items-baseline justify-between border-b border-dashed border-border pb-2">
                <dt className="text-xs text-muted">Координаты</dt>
                <dd className="m-0 font-mono text-xs">{formatCoord(zoo.lat, zoo.lng)}</dd>
              </div>
              {zoo.areaHa ? (
                <div className="flex items-baseline justify-between border-b border-dashed border-border pb-2">
                  <dt className="text-xs text-muted">Площадь</dt>
                  <dd className="m-0 font-mono text-xs">{formatNumber(zoo.areaHa)} га</dd>
                </div>
              ) : null}
              {zoo.annualVisitors ? (
                <div className="flex items-baseline justify-between border-b border-dashed border-border pb-2">
                  <dt className="text-xs text-muted">Посещаемость</dt>
                  <dd className="m-0 font-mono text-xs">
                    {formatNumber(zoo.annualVisitors)} / год
                  </dd>
                </div>
              ) : null}
              <div className="flex items-baseline justify-between">
                <dt className="text-xs text-muted">Первоисточников</dt>
                <dd className="m-0 font-mono text-xs font-bold text-accent">
                  {zoo.provenance.length}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4 text-xs">
              <a href="#species" className="badge hover:border-accent">
                Виды ({zoo.species.length})
              </a>
              <a href="#programs" className="badge hover:border-accent">
                Программы ({zoo.programs.length})
              </a>
              <a href="#sources" className="badge hover:border-accent">
                Источники ({zoo.provenance.length})
              </a>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

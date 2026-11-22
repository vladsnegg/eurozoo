import type { Metadata } from 'next';
import Link from 'next/link';
import type { SpeciesDetailDto } from '@eurozoo/shared';
import { NetworkIcon } from '@/components/icons';
import { IucnBadge, IucnSpectrum, LineageTrail, SourceList } from '@/components/knowledge';
import { Badge, Breadcrumbs, DataTable, EmptyState, Notice, Section } from '@/components/page';
import { getOne } from '@/lib/api';
import { RelatedPanel } from '@/components/related-panel';
import { formatNumber, formatRange, PROGRAM_CODE_LABELS } from '@/lib/format';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const species = await getOne<SpeciesDetailDto>(`/species/${slug}`);
  return {
    title: `${species.commonNameRu ?? species.scientificName} (${species.scientificName})`,
    description: `${species.scientificName} — таксономия, охранный статус и зоопарки содержания в базе EuroZoo Atlas.`,
    alternates: { canonical: `/species/${species.slug}` },
  };
}

export default async function SpeciesDetailPage({ params }: Props) {
  const { slug } = await params;
  const species = await getOne<SpeciesDetailDto>(`/species/${slug}`);

  const family = species.lineage.find((node) => node.rank.code === 'family');
  const order = species.lineage.find((node) => node.rank.code === 'order');

  return (
    <>
      <Breadcrumbs
        items={[
          { href: '/', label: 'Главная' },
          { href: '/species', label: 'Виды' },
          { label: species.commonNameRu ?? species.scientificName },
        ]}
      />

      {/* Editorial Specimen Header */}
      <section className="specimen-hero rise">
        {species.imageUrl ? (
          <div
            className="specimen-hero-photo"
            style={{ backgroundImage: `url("${species.imageUrl}")` }}
            aria-hidden="true"
          />
        ) : null}
        <div className="specimen-hero-content">
          <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="hero-eyebrow">
                SPECIES // {order?.scientificName?.toUpperCase() ?? 'CHORDATA'} →{' '}
                {family?.scientificName?.toUpperCase() ?? 'TAXON'}
              </span>
              {species.iucn ? (
                <span className="hero-eyebrow-mono">
                  IUCN {species.iucn.code} · {species.iucn.nameRu}
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 mb-1 font-serif text-4xl font-semibold italic tracking-normal text-white sm:text-6xl">
              {species.scientificName}
            </h1>
            <p className="m-0 text-lg text-white/75">
              {[
                species.commonNameRu,
                species.commonNameEn !== species.scientificName ? species.commonNameEn : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={`/graph?seed=species:${species.id}&depth=2`}
              className="btn btn-primary btn-sm"
            >
              <NetworkIcon size={15} />
              <span>В графе знаний</span>
            </Link>
          </div>
        </div>

        {species.description ? (
          <p className="mt-5 max-w-[74ch] text-base leading-relaxed text-white/80">
            {species.description}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/12 bg-black/25 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-wider text-white/55">
              Шкала угрозы IUCN:
            </span>
            <IucnSpectrum activeCode={species.iucn?.code} />
          </div>
          {species.habitats.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-white/55">
                Биомы:
              </span>
              {species.habitats.map((habitat) => (
                <span key={habitat.id} className="hero-chip">
                  {habitat.name}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <dl className="specimen-hero-metrics">
          <div>
            <dt>Семейство</dt>
            <dd>
              {family ? (
                <Link
                  href={`/taxonomy/family/${family.slug}`}
                  className="text-white hover:text-[#c8f560]"
                >
                  {family.scientificName}
                </Link>
              ) : (
                '—'
              )}
            </dd>
          </div>
          <div>
            <dt>Зоопарков Европы</dt>
            <dd className="font-mono text-[#c8f560]">{species.zoos.length}</dd>
          </div>
          <div>
            <dt>Программ EEP/ESB</dt>
            <dd className="font-mono">{species.programs.length}</dd>
          </div>
          <div>
            <dt>Номенклатура</dt>
            <dd className="font-mono text-sm">
              {species.authority
                ? `${species.authority}${species.yearDescribed ? `, ${species.yearDescribed}` : ''}`
                : 'GBIF Backbone'}
            </dd>
          </div>
        </dl>
          {species.imageUrl && species.imageCreditUrl ? (
            <a
              className="specimen-photo-credit"
              href={species.imageCreditUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Фото: {species.imageCredit ?? 'Wikimedia Commons'}
            </a>
          ) : null}
        </div>
      </section>

      <div className="panel mt-6 p-4">
        <div className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
          Полная таксономическая линия (R2 Lineage)
        </div>
        <LineageTrail items={species.lineage} />
      </div>

      {(species.profile?.habitatSummary ||
        species.profile?.dietSummary ||
        species.profile?.lifespanYears ||
        species.profile?.weightKgMin ||
        species.profile?.lengthCmMin) ? (
        <Section title="Биологический профиль" id="profile">
          <div className="panel grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className="meta-label">Охранный статус</span>
              <div className="mt-1.5">
                <IucnBadge iucn={species.iucn} />
              </div>
            </div>
            {species.profile?.lifespanYears ? (
              <div>
                <span className="meta-label">Продолжительность жизни</span>
                <div className="meta-value">{species.profile.lifespanYears} лет</div>
              </div>
            ) : null}
            {species.profile?.weightKgMin || species.profile?.weightKgMax ? (
              <div>
                <span className="meta-label">Масса</span>
                <div className="meta-value">
                  {formatRange(species.profile?.weightKgMin, species.profile?.weightKgMax, 'кг')}
                </div>
              </div>
            ) : null}
            {species.profile?.lengthCmMin || species.profile?.lengthCmMax ? (
              <div>
                <span className="meta-label">Длина тела</span>
                <div className="meta-value">
                  {formatRange(species.profile?.lengthCmMin, species.profile?.lengthCmMax, 'см')}
                </div>
              </div>
            ) : null}
          </div>
          {species.profile?.habitatSummary ? (
            <p className="mt-3 text-sm text-muted">
              <strong>Местообитания:</strong> {species.profile.habitatSummary}
            </p>
          ) : null}
          {species.profile?.dietSummary ? (
            <p className="text-sm text-muted">
              <strong>Рацион:</strong> {species.profile.dietSummary}
            </p>
          ) : null}
        </Section>
      ) : null}

      <Section
        title={`Где содержится (${species.zoos.length})`}
        id="zoos"
      >
        {species.zoos.length === 0 ? (
          <EmptyState
            title="Нет подтверждённых данных"
            description="Связи добавляются только при наличии источника."
          />
        ) : (
          <DataTable
            caption="Зоопарки, где содержится вид"
            head={['Зоопарк', 'Город и страна', 'Статус в коллекции']}
          >
            {species.zoos.map((entry) => {
              const count =
                entry.countMale === null &&
                entry.countFemale === null &&
                entry.countUnsexed === null
                  ? null
                  : (entry.countMale ?? 0) +
                    (entry.countFemale ?? 0) +
                    (entry.countUnsexed ?? 0);
              return (
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
                    {count !== null
                      ? `${formatNumber(count)} особ.`
                      : entry.breeding
                        ? 'размножается'
                        : 'подтверждено источником'}
                  </td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </Section>

      <Section title="Программы сохранения вида" id="programs">
        {species.programs.length === 0 ? (
          <p className="panel p-4 text-sm text-muted">Программы для вида не указаны.</p>
        ) : (
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
            {species.programs.map((program) => (
              <li key={program.id} className="panel flex items-center justify-between gap-3 p-4">
                <div>
                  <Badge tone="accent">
                    {PROGRAM_CODE_LABELS[program.code] ?? program.code}
                  </Badge>
                  <Link
                    href={`/programs/${program.slug}`}
                    className="mt-2 block text-base font-bold text-text hover:text-accent"
                  >
                    {program.name}
                  </Link>
                </div>
                <span className="font-mono text-xs text-muted">
                  {program.zooCount} зоопарков
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {species.inferredProgramSpecies.length > 0 ? (
        <Section
          title="Выведенные связи (R3)"
          id="inferred"
        >
          <Notice>
            Связи вычислены правилом R3: зоопарк → программа → вид.
          </Notice>
          <ul className="m-0 mt-3 grid list-none gap-2 p-0 sm:grid-cols-2">
            {species.inferredProgramSpecies.map((row) => (
              <li
                key={`${row.zoo.id}-${row.program.id}`}
                className="panel flex items-center justify-between gap-2 p-3 text-sm"
              >
                <Link href={`/zoos/${row.zoo.slug}`} className="font-semibold">
                  {row.zoo.name}
                </Link>
                <span className="font-mono text-xs text-muted">via</span>
                <Link href={`/programs/${row.program.slug}`} className="text-xs text-muted hover:text-accent">
                  {row.program.name}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {species.research.length > 0 ? (
        <Section title="Научные исследования" id="research">
          <ul className="m-0 grid list-none gap-2.5 p-0">
            {species.research.map((project) => (
              <li key={project.id} className="panel p-4">
                <Link href={`/research/${project.slug}`} className="font-semibold">
                  {project.title}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <RelatedPanel type="species" id={species.id} />

      <Section title="Источники и провенанс" id="sources">
        <SourceList items={species.provenance} />
      </Section>
    </>
  );
}

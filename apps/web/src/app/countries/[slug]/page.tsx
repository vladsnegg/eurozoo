import type { Metadata } from 'next';
import Link from 'next/link';
import type { CountryDetailDto } from '@eurozoo/shared';
import { Breadcrumbs, EmptyState, Meta, PageHeader, Section } from '@/components/page';
import { CountryFlag } from '@/components/country-flag';
import { getOne } from '@/lib/api';
import { rethrowNotFound } from '@/lib/not-found';
import { formatNumber } from '@/lib/format';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const country = await getOne<CountryDetailDto>(`/countries/${slug}`);
    return {
      title: country.name,
      description: `${country.name}: зоопарки, города и виды в базе знаний EuroZoo Atlas.`,
      alternates: { canonical: `/countries/${country.slug}` },
    };
  } catch (error) {
    rethrowNotFound(error);
    return { title: 'Страна не найдена' };
  }
}

export default async function CountryPage({ params }: Props) {
  const { slug } = await params;
  const country = await getOne<CountryDetailDto>(`/countries/${slug}`);

  return (
    <>
      <Breadcrumbs
        items={[
          { href: '/', label: 'Главная' },
          { href: '/countries', label: 'География' },
          { label: country.name },
        ]}
      />
      <PageHeader
        eyebrow="Страна"
        title={country.name}
        description={country.nameLocal ?? undefined}
        actions={<CountryFlag iso2={country.iso2} size={30} />}
      />

      <dl className="meta-grid">
        <Meta label="ISO" value={`${country.iso2} / ${country.iso3}`} />
        <Meta label="Член ЕС" value={country.euMember ? 'да' : 'нет'} />
        <Meta label="Зоопарков" value={formatNumber(country.zooCount)} />
        <Meta label="Видов" value={formatNumber(country.speciesCount)} />
      </dl>

      <Section title="Зоопарки" id="zoos">
        {country.zoos.length === 0 ? (
          <EmptyState title="Зоопарки не добавлены" />
        ) : (
          <ul className="grid list-none gap-2 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {country.zoos.map((zoo) => (
              <li key={zoo.id} className="panel p-4">
                <Link href={`/zoos/${zoo.slug}`}>{zoo.name}</Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Города" id="cities">
        {country.cities.length === 0 ? (
          <p className="text-sm text-muted">Города не добавлены.</p>
        ) : (
          <ul className="tag-list">
            {country.cities.map((city) => (
              <li key={city.id}>
                <Link href={`/cities/${city.slug}`}>{city.name}</Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Организации" id="organizations">
        {country.organizations.length === 0 ? (
          <p className="text-sm text-muted">Организации не указаны.</p>
        ) : (
          <ul className="grid list-none gap-2 p-0">
            {country.organizations.map((organization) => (
              <li key={organization.id}>
                <Link href={`/organizations/${organization.slug}`}>{organization.name}</Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}

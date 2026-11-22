import type { Metadata } from 'next';
import Link from 'next/link';
import type { CityDetailDto } from '@eurozoo/shared';
import { Breadcrumbs, EmptyState, Meta, PageHeader, Section } from '@/components/page';
import { getOne } from '@/lib/api';
import { rethrowNotFound } from '@/lib/not-found';
import { formatNumber } from '@/lib/format';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const city = await getOne<CityDetailDto>(`/cities/${slug}`);
    return {
      title: `${city.name} — зоопарки`,
      description: `Зоопарки в городе ${city.name}, ${city.country.name}.`,
    };
  } catch (error) {
    rethrowNotFound(error);
    return { title: 'Город не найден' };
  }
}

export default async function CityPage({ params }: Props) {
  const { slug } = await params;
  const city = await getOne<CityDetailDto>(`/cities/${slug}`);

  return (
    <>
      <Breadcrumbs
        items={[
          { href: '/', label: 'Главная' },
          { href: '/countries', label: 'География' },
          { href: `/countries/${city.country.slug}`, label: city.country.name },
          { label: city.name },
        ]}
      />
      <PageHeader eyebrow="Город" title={city.name} description={city.country.name} />

      <dl className="meta-grid">
        <Meta label="Страна" value={city.country.name} />
        <Meta label="Регион" value={city.region?.name ?? 'нет данных'} />
        <Meta label="Население" value={formatNumber(city.population)} />
        <Meta
          label="Координаты"
          value={city.lat !== null && city.lng !== null ? `${city.lat.toFixed(4)}, ${city.lng.toFixed(4)}` : 'нет данных'}
        />
      </dl>

      <Section title="Зоопарки" id="zoos">
        {city.zoos.length === 0 ? (
          <EmptyState title="Зоопарки не добавлены" />
        ) : (
          <ul className="grid list-none gap-2 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {city.zoos.map((zoo) => (
              <li key={zoo.id} className="panel p-4">
                <Link href={`/zoos/${zoo.slug}`}>{zoo.name}</Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}

import Link from 'next/link';
import type { ZooSummaryDto } from '@eurozoo/shared';
import { safeList } from '@/lib/api';
import { EuropeAtlasMap } from '@/components/europe-atlas-map';
import { ArrowRightIcon, NetworkIcon, PawIcon } from '@/components/icons';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const zoos = await safeList<ZooSummaryDto>('/zoos', { pageSize: 1000 });

  const mapPoints = zoos.map((z) => ({
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
    <div className="atlas-home">
      <section className="hero-2026 rise">
        <div className="hero-2026-grid">
          <div className="hero-2026-copy">
            <h1>
              Атлас зоопарков,
              <br />
              видов и <span className="hero-serif-accent">сохранения.</span>
            </h1>

            <p className="hero-lead">Зоопарки, виды и связи Европы — на одной карте.</p>

            <div className="hero-actions">
              <Link href="/zoos" className="btn btn-primary">
                <span>Зоопарки</span>
                <ArrowRightIcon size={16} />
              </Link>
              <Link href="/species" className="btn btn-ghost">
                <PawIcon size={16} />
                <span>Виды</span>
              </Link>
              <Link href="/graph" className="btn btn-ghost">
                <NetworkIcon size={16} />
                <span>Граф</span>
              </Link>
            </div>
          </div>

          <div className="hero-2026-map">
            <EuropeAtlasMap zoos={mapPoints} />
          </div>
        </div>
      </section>
    </div>
  );
}

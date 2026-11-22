import Link from 'next/link';
import type { NewsSummaryDto } from '@eurozoo/shared';
import { CountryFlag } from './country-flag';
import { ArrowUpRightIcon } from './icons';

export function NewsCard({ item }: { item: NewsSummaryDto }) {
  return (
    <article className="panel flex h-full flex-col gap-3 p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        {item.zoo.locationLabel ? null : (
          <CountryFlag iso2={item.zoo.city.country.iso2} size={18} />
        )}
        <Link href={`/zoos/${item.zoo.slug}`} className="font-semibold text-text hover:text-accent">
          {item.zoo.name}
        </Link>
        <span aria-hidden="true">·</span>
        <span>{item.zoo.city.name}</span>
        <time className="ml-auto font-mono" dateTime={item.publishedAt}>
          {formatNewsDate(item.publishedAt)}
        </time>
      </div>

      <h3 className="m-0 text-xl leading-snug">
        <a href={item.url} target="_blank" rel="noreferrer">
          {item.title}
        </a>
      </h3>

      {item.summary ? (
        <p className="m-0 text-sm leading-relaxed text-muted">{item.summary}</p>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-border pt-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
          {item.sourceName ?? 'Источник'}
        </span>
        <a href={item.url} target="_blank" rel="noreferrer" className="link-arrow">
          Читать <ArrowUpRightIcon size={14} />
        </a>
      </div>
    </article>
  );
}

export function formatNewsDate(value: string): string {
  return new Date(value).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

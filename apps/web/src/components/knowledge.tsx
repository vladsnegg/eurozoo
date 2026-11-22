import Link from 'next/link';
import type { ReactNode } from 'react';
import { Badge } from './ui';
import { ENTITY_LABELS, formatDate } from '@/lib/format';
import { ArrowUpRightIcon, ShieldIcon } from './icons';

type Iucn = { code: string; nameRu: string; severity: number; color: string } | null;

const IUCN_SCALE: Array<{ code: string; color: string; label: string }> = [
  { code: 'LC', color: '#2f7d4a', label: 'Наименьшие опасения' },
  { code: 'NT', color: '#5b7f2a', label: 'Близкий к уязвимому' },
  { code: 'VU', color: '#a37a00', label: 'Уязвимый' },
  { code: 'EN', color: '#c25e00', label: 'Исчезающий' },
  { code: 'CR', color: '#b3261e', label: 'На грани исчезновения' },
  { code: 'EW', color: '#4a4a4a', label: 'Исчез в дикой природе' },
];

export function IucnBadge({ iucn }: { iucn: Iucn }) {
  if (!iucn) {
    return <Badge>статус IUCN не указан</Badge>;
  }
  return (
    <span className="iucn-pill" title={iucn.nameRu}>
      <span
        aria-hidden="true"
        className="iucn-dot"
        style={{ background: iucn.color, boxShadow: `0 0 10px ${iucn.color}` }}
      />
      <strong className="font-mono text-[11px] font-bold tracking-wider">{iucn.code}</strong>
      <span className="text-[11.5px] font-medium text-muted">{iucn.nameRu}</span>
    </span>
  );
}

export function IucnSpectrum({ activeCode }: { activeCode?: string | null }) {
  return (
    <div className="iucn-spectrum" aria-label="Шкала охранного статуса IUCN">
      {IUCN_SCALE.map((step) => {
        const active = step.code === activeCode;
        return (
          <span
            key={step.code}
            title={`${step.code} — ${step.label}`}
            className={`iucn-step ${active ? 'iucn-step-active' : ''}`}
            style={
              active
                ? {
                    background: step.color,
                    borderColor: step.color,
                    color: '#ffffff',
                    boxShadow: `0 4px 14px -3px ${step.color}`,
                  }
                : undefined
            }
          >
            {step.code}
          </span>
        );
      })}
    </div>
  );
}

type Provenance = {
  sourceId: string;
  title: string;
  url: string;
  publisher: string | null;
  type: string;
  reliability: string;
  confidence: number | null;
  retrievedAt: string | null;
  verifiedAt: string | null;
  status: string;
};

export function SourceBadge({ item }: { item: Provenance }) {
  return (
    <details className="source-badge inline-block text-xs">
      <summary>источник</summary>
      <div className="source-card">
        <p className="text-sm font-semibold">{item.title}</p>
        {item.publisher ? <p className="mt-0.5 text-xs text-muted">{item.publisher}</p> : null}
        <p className="mt-1 text-xs text-muted">
          Проверено: {formatDate(item.verifiedAt)}
          {item.status !== 'current' ? ` · статус: ${item.status}` : ''}
        </p>
        <a
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold"
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Открыть первоисточник
        </a>
      </div>
    </details>
  );
}

export function SourceBadges({ items }: { items: Provenance[] }) {
  if (items.length === 0) return null;
  return (
    <details className="source-badge inline-block text-xs">
      <summary className="inline-flex items-center gap-1.5">
        <ShieldIcon size={13} />
        <span>
          Верифицировано · {items.length} {items.length === 1 ? 'источник' : 'источников'}
        </span>
      </summary>
      <div className="source-card !max-w-[540px]">
        <SourceList items={items} />
      </div>
    </details>
  );
}

export function EntityCard({
  href,
  type,
  title,
  subtitle,
  meta,
  badge,
  imageUrl,
  imageAlt,
  children,
  italicTitle = false,
}: {
  href: string;
  type: string;
  title: string;
  subtitle?: string | null;
  meta?: ReactNode;
  badge?: ReactNode;
  imageUrl?: string | null;
  imageAlt?: string;
  children?: ReactNode;
  italicTitle?: boolean;
}) {
  return (
    <article className="entity-card group">
      {imageUrl ? (
        <div className="entity-media">
          <img src={imageUrl} alt={imageAlt ?? ''} loading="lazy" />
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="entity-kicker">{ENTITY_LABELS[type] ?? type}</p>
          {badge}
        </div>
        <Link
          href={href}
          aria-label={`Открыть: ${title}`}
          className="entity-open-btn"
        >
          <ArrowUpRightIcon size={15} />
        </Link>
      </div>

      <h3
        className={`mt-3 mb-0 text-[1.24rem] leading-[1.18] ${
          italicTitle ? 'font-serif italic text-[1.42rem] font-semibold tracking-normal' : ''
        }`}
      >
        <Link href={href} className="text-text">
          {title}
        </Link>
      </h3>
      {subtitle ? <p className="mt-1.5 mb-0 text-sm text-muted">{subtitle}</p> : null}
      {meta ? <div className="entity-meta">{meta}</div> : null}
      {children}
    </article>
  );
}

export function LineageTrail({
  items,
}: {
  items: Array<{ slug: string; scientificName: string; rank: { code: string; nameRu: string } }>;
}) {
  return (
    <ol className="lineage">
      {items.map((item, index) => (
        <li key={item.slug} data-current={index === items.length - 1 ? 'true' : undefined}>
          {index > 0 ? (
            <span aria-hidden="true" className="mx-1 opacity-35">
              /
            </span>
          ) : null}
          <Link href={`/taxonomy/${item.rank.code}/${item.slug}`} title={item.rank.nameRu}>
            <span className="font-mono text-[10px] uppercase tracking-wider opacity-60">
              {item.rank.nameRu}:
            </span>{' '}
            <span className={item.rank.code === 'species' || item.rank.code === 'genus' ? 'italic' : ''}>
              {item.scientificName}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

export function SourceList({ items }: { items: Provenance[] }) {
  if (items.length === 0) return <p className="text-sm text-muted">Источники не указаны.</p>;
  return (
    <ul className="m-0 grid list-none gap-2.5 p-0">
      {items.map((item, index) => (
        <li
          key={`${item.sourceId}-${item.title}-${index}`}
          className="panel flex flex-wrap items-center justify-between gap-3 p-4 text-sm"
        >
          <div className="min-w-0 flex-1">
            <a
              className="inline-flex items-center gap-1.5 font-semibold text-text hover:text-accent"
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{item.title}</span>
              <ArrowUpRightIcon size={13} />
            </a>
            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] text-muted">
              {item.publisher ? <span>{item.publisher}</span> : null}
              <span>· проверено {formatDate(item.verifiedAt)}</span>
              <span>· {item.reliability}</span>
              {item.confidence !== null ? (
                <span>· {Math.round(item.confidence * 100)}%</span>
              ) : null}
            </div>
          </div>
          <span className="badge badge-accent font-mono text-[10.5px] uppercase">
            {item.status === 'current' ? 'verified' : item.status}
          </span>
        </li>
      ))}
    </ul>
  );
}

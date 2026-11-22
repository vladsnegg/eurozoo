import Link from 'next/link';
import type { ReactNode } from 'react';

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'warning' | 'danger' | 'info';
}) {
  const tones: Record<string, string> = {
    neutral: 'badge',
    accent: 'badge badge-accent',
    warning: 'badge badge-warning',
    danger: 'badge badge-danger',
    info: 'badge badge-info',
  };
  return <span className={tones[tone]}>{children}</span>;
}

export function Section({
  title,
  description,
  actions,
  children,
  id,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="section" aria-labelledby={id ? `${id}-title` : undefined}>
      <div className="section-head">
        <div>
          <h2 id={id ? `${id}-title` : undefined} className="section-title">
            {title}
          </h2>
          {description ? <p className="section-desc">{description}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <p>{title}</p>
      {description ? <p className="muted mt-2 text-sm">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  pathname,
  query = {},
}: {
  page: number;
  pageSize: number;
  total: number;
  pathname: string;
  query?: Record<string, string | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;

  const href = (next: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') params.set(key, value);
    }
    if (next > 1) params.set('page', String(next));
    else params.delete('page');
    const suffix = params.toString();
    return suffix ? `${pathname}?${suffix}` : pathname;
  };

  const prev = page > 1 ? href(page - 1) : undefined;
  const next = page < pages ? href(page + 1) : undefined;

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-between gap-4" aria-label="Пагинация">
      <div className="text-sm text-muted">
        Страница <strong>{page}</strong> из {pages} · всего {total}
      </div>
      <div className="flex gap-2">
        {prev ? (
          <Link className="btn btn-outline btn-sm" href={prev}>
            ← Назад
          </Link>
        ) : (
          <span className="btn btn-outline btn-sm opacity-40" aria-disabled="true">
            ← Назад
          </span>
        )}
        {next ? (
          <Link className="btn btn-outline btn-sm" href={next}>
            Вперёд →
          </Link>
        ) : (
          <span className="btn btn-outline btn-sm opacity-40" aria-disabled="true">
            Вперёд →
          </span>
        )}
      </div>
    </nav>
  );
}

export function Breadcrumbs({ items }: { items: Array<{ href?: string; label: string }> }) {
  return (
    <nav aria-label="Хлебные крошки" className="breadcrumbs">
      <ol>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            {index > 0 ? (
              <span aria-hidden="true" className="opacity-40">
                /
              </span>
            ) : null}
            {item.href ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function DataTable({
  caption,
  head,
  children,
}: {
  caption: string;
  head: string[];
  children: ReactNode;
}) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {head.map((cell) => (
              <th key={cell} scope="col">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Meta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="meta-label">{label}</dt>
      <dd className="meta-value m-0">{value}</dd>
    </div>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return <p className="notice m-0">{children}</p>;
}

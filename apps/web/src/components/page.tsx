import Link from 'next/link';
import type { Metadata } from 'next';

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="page-header">
      <div className="min-w-0">
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export { Badge, EmptyState, Notice, Pagination, Breadcrumbs, DataTable, Meta, Section } from './ui';

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="link-arrow text-sm">
      ← {children}
    </Link>
  );
}

export function metadataFor(title: string, description: string): Metadata {
  return { title, description };
}

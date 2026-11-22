import Link from 'next/link';
import type { RelatedGroupDto, SimilarEntityDto } from '@eurozoo/shared';
import { apiGet } from '@/lib/api-client';
import { ArrowRightIcon } from './icons';

async function load<T>(path: string): Promise<T[]> {
  try {
    return await apiGet<T[]>(path);
  } catch {
    return [];
  }
}

export async function RelatedPanel({
  type,
  id,
  graphLabel = 'Открыть в графе',
}: {
  type: string;
  id: string;
  graphLabel?: string;
}) {
  const [related, similar] = await Promise.all([
    load<RelatedGroupDto>(`/entities/${type}/${id}/related`),
    load<SimilarEntityDto>(`/entities/${type}/${id}/similar`),
  ]);

  if (related.length === 0 && similar.length === 0) return null;

  return (
    <section aria-labelledby="related-title" className="section">
      <div className="section-head">
        <div>
          <h2 id="related-title" className="section-title">
            Связанные знания
          </h2>
          <p className="section-desc">Связи из графа: программы, география, организации и похожие объекты.</p>
        </div>
        <Link href={`/graph?seed=${type}:${id}&depth=2`} className="link-arrow">
          {graphLabel} <ArrowRightIcon size={15} />
        </Link>
      </div>

      {related.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((group) => (
            <div key={group.predicate} className="panel p-5">
              <h3 className="m-0 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                {group.labelRu}
              </h3>
              <ul className="m-0 mt-3 grid list-none gap-2 p-0 text-sm">
                {group.items.map((item, index) => (
                  <li key={`${item.type}-${item.id}-${index}`}>
                    <Link href={item.url} className="font-medium">
                      {item.label}
                    </Link>
                    {item.subtitle ? (
                      <span className="ml-2 text-xs text-muted">{item.subtitle}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}

      {similar.length > 0 ? (
        <div className="mt-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-muted">Похожие</h3>
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
            {similar.map((item, index) => (
              <li key={`${item.type}-${item.id}-${index}`} className="panel p-4 text-sm">
                <Link href={item.url} className="font-medium">
                  {item.label}
                </Link>
                <span className="ml-2 text-xs text-muted">{item.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

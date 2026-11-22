import { notFound } from 'next/navigation';
import { EntityForm } from '@/components/admin/entity-form';
import { PageHeader } from '@/components/page';
import { adminResource } from '@/lib/admin-resources';
import { serverApi } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

export default async function AdminEditPage({
  params,
}: {
  params: Promise<{ resource: string; id: string }>;
}) {
  const { resource, id } = await params;
  const config = adminResource(resource);
  if (!config) notFound();

  const row = await serverApi<Record<string, unknown>>(`/admin/${resource}/${id}`);

  return (
    <>
      <PageHeader
        eyebrow="Куратор"
        title={`Изменение · ${config.label}`}
        description={String(row.id)}
      />
      <EntityForm resource={resource} fields={config.fields} id={id} initial={row} />
    </>
  );
}

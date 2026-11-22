import { notFound } from 'next/navigation';
import { EntityForm } from '@/components/admin/entity-form';
import { PageHeader } from '@/components/page';
import { adminResource } from '@/lib/admin-resources';

export const dynamic = 'force-dynamic';

export default async function AdminNewPage({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  const { resource } = await params;
  const config = adminResource(resource);
  if (!config) notFound();

  return (
    <>
      <PageHeader
        eyebrow="Куратор"
        title={`Новая запись · ${config.label}`}
        description="Поля обязательны, если отмечены *."
      />
      <EntityForm resource={resource} fields={config.fields} />
    </>
  );
}

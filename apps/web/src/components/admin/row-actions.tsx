'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export function RowActions({
  resource,
  id,
  publishable,
  canDelete,
  published,
}: {
  resource: string;
  id: string;
  publishable: boolean;
  canDelete: boolean;
  published: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const call = async (path: string, method: string) => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}${path}`, { method, credentials: 'include' });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
        setError(payload?.detail ?? `Ошибка ${response.status}`);
        return;
      }
      router.refresh();
    } catch {
      setError('Сервер недоступен');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <a href={`/admin/${resource}/${id}`} className="btn btn-outline btn-sm">
        Изменить
      </a>
      {publishable && !published ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => call(`/admin/${resource}/${id}/publish`, 'POST')}
          className="btn btn-primary btn-sm"
        >
          Опубликовать
        </button>
      ) : null}
      {canDelete ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (!window.confirm('Удалить запись? Действие необратимо.')) return;
            void call(`/admin/${resource}/${id}`, 'DELETE');
          }}
          className="btn btn-outline btn-sm !text-danger"
        >
          Удалить
        </button>
      ) : null}
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </div>
  );
}

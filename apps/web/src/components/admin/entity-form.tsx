'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { AdminField } from '@/lib/admin-resources';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export function EntityForm({
  resource,
  fields,
  id,
  initial,
}: {
  resource: string;
  fields: AdminField[];
  id?: string;
  initial?: Record<string, unknown>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const seed: Record<string, unknown> = {};
    for (const field of fields) {
      const raw = initial?.[field.name];
      if (field.type === 'date' && typeof raw === 'string') {
        seed[field.name] = raw.slice(0, 10);
      } else {
        seed[field.name] = raw ?? (field.type === 'checkbox' ? false : '');
      }
    }
    return seed;
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {};
    for (const field of fields) {
      const value = values[field.name];
      if (value === '' || value === undefined) continue;
      payload[field.name] = value;
    }

    try {
      const response = await fetch(
        `${API_URL}/admin/${resource}${id ? `/${id}` : ''}`,
        {
          method: id ? 'PATCH' : 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          detail?: string;
          errors?: Array<{ message: string }>;
        } | null;
        const message =
          body?.errors?.map((issue) => issue.message).join('; ') ??
          body?.detail ??
          `Ошибка ${response.status}`;
        setError(message);
        return;
      }

      router.push(`/admin/${resource}`);
      router.refresh();
    } catch {
      setError('Сервер недоступен');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="panel grid max-w-3xl gap-4 p-6">
      {fields.map((field) => {
        const idAttr = `field-${field.name}`;
        const value = values[field.name];

        return (
          <div key={field.name} className="field">
            <label htmlFor={idAttr} className="field-label">
              {field.label}
              {field.required ? ' *' : ''}
            </label>

            {field.type === 'textarea' ? (
              <textarea
                id={idAttr}
                value={String(value ?? '')}
                onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}
                rows={4}
                className="input"
              />
            ) : field.type === 'select' ? (
              <select
                id={idAttr}
                value={String(value ?? '')}
                onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}
                className="input"
              >
                <option value="">— не выбрано —</option>
                {(field.options ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'checkbox' ? (
              <input
                id={idAttr}
                type="checkbox"
                checked={Boolean(value)}
                onChange={(event) => setValues({ ...values, [field.name]: event.target.checked })}
                className="h-4 w-4"
              />
            ) : (
              <input
                id={idAttr}
                type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                step={field.type === 'number' ? 'any' : undefined}
                required={field.required}
                value={String(value ?? '')}
                onChange={(event) =>
                  setValues({
                    ...values,
                    [field.name]: field.type === 'number' ? event.target.value : event.target.value,
                  })
                }
                className="input"
              />
            )}

            {field.hint ? <p className="m-0 text-xs text-muted">{field.hint}</p> : null}
          </div>
        );
      })}

      {error ? (
        <p role="alert" className="m-0 rounded-xl border border-[#ecc9c2] bg-[#fcefec] px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? 'Сохраняем…' : 'Сохранить'}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/admin/${resource}`)}
          className="btn btn-outline"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}

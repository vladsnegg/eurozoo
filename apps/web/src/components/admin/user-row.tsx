'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export function UserRow({
  user,
}: {
  user: { id: string; email: string; role: string; isActive: boolean; displayName: string };
}) {
  const router = useRouter();
  const [role, setRole] = useState(user.role);
  const [active, setActive] = useState(user.isActive);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async (payload: Record<string, unknown>) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/admin/users/${user.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { detail?: string } | null;
        setError(body?.detail ?? `Ошибка ${response.status}`);
        return;
      }
      router.refresh();
    } catch {
      setError('Сервер недоступен');
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr>
      <td>{user.email}</td>
      <td>{user.displayName}</td>
      <td>
        <select
          value={role}
          disabled={saving}
          onChange={(event) => setRole(event.target.value)}
          className="select !min-h-0 !py-1.5"
          aria-label={`Роль ${user.email}`}
        >
          <option value="viewer">viewer</option>
          <option value="editor">editor</option>
          <option value="admin">admin</option>
        </select>
      </td>
      <td>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={active}
            disabled={saving}
            onChange={(event) => setActive(event.target.checked)}
          />
          активен
        </label>
      </td>
      <td>
        <button
          type="button"
          disabled={saving}
          onClick={() => save({ role, isActive: active })}
          className="btn btn-outline btn-sm"
        >
          Сохранить
        </button>
        {error ? <div className="text-xs text-danger">{error}</div> : null}
      </td>
    </tr>
  );
}

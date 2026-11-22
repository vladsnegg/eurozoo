'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LeafIcon, ShieldIcon } from '@/components/icons';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="auth">
      <div className="auth-side">
        <span className="brand-mark">
          <LeafIcon size={22} />
        </span>
        <h1 className="mt-6">Панель куратора</h1>
        <p>
          Управление зоопарками, видами, программами и источниками. Каждая мутация попадает в
          журнал изменений, публикация требует проверенного источника.
        </p>
        <div className="mt-8 grid gap-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="feature-icon h-9 w-9 rounded-xl">
              <ShieldIcon size={17} />
            </span>
            <span>RBAC: viewer, editor, admin</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="feature-icon h-9 w-9 rounded-xl">
              <LeafIcon size={17} />
            </span>
            <span>Публикация только с провенансом</span>
          </div>
        </div>
      </div>

      <form
        className="auth-form"
        onSubmit={async (event) => {
          event.preventDefault();
          setLoading(true);
          setError(null);
          try {
            const response = await fetch(`${API_URL}/auth/login`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            });
            if (!response.ok) {
              const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
              setError(payload?.detail ?? 'Не удалось войти');
              return;
            }
            router.replace('/admin');
            router.refresh();
          } catch {
            setError('Сервер недоступен');
          } finally {
            setLoading(false);
          }
        }}
      >
        <div>
          <span className="eyebrow">Вход</span>
          <h2 className="mt-3">Административная панель</h2>
          <p className="m-0 text-sm text-muted">
            Доступ только для редакторов и администраторов. Сессия хранится в защищённой cookie.
          </p>
        </div>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input"
            autoComplete="username"
          />
        </label>
        <label className="field">
          <span>Пароль</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="input"
            autoComplete="current-password"
          />
        </label>
        {error ? (
          <p role="alert" className="m-0 rounded-xl border border-[#ecc9c2] bg-[#fcefec] px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? 'Входим…' : 'Войти'}
        </button>
      </form>
    </div>
  );
}

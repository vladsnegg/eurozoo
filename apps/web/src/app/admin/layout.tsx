import type { Metadata } from 'next';
import Link from 'next/link';
import { LogoutButton } from '@/components/admin/logout-button';
import { ShieldIcon } from '@/components/icons';
import { serverApi } from '@/lib/server-api';

export const metadata: Metadata = {
  title: 'Административная панель',
  robots: { index: false, follow: false },
};

type User = { id: string; email: string; displayName: string; role: 'viewer' | 'editor' | 'admin' };

const LINKS = [
  { href: '/admin', label: 'Дашборд' },
  { href: '/admin/zoos', label: 'Зоопарки' },
  { href: '/admin/taxa', label: 'Таксоны и виды' },
  { href: '/admin/sources', label: 'Источники' },
  { href: '/admin/organizations', label: 'Организации' },
  { href: '/admin/programs', label: 'Программы' },
  { href: '/admin/research', label: 'Исследования' },
  { href: '/admin/news', label: 'Новости' },
  { href: '/admin/synonyms', label: 'Синонимы' },
  { href: '/admin/revisions', label: 'Журнал' },
  { href: '/admin/users', label: 'Пользователи' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await serverApi<{ user: User }>('/auth/me');

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-user">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
            <ShieldIcon size={13} /> Панель куратора
          </div>
          <strong className="mt-2">{user.displayName}</strong>
          <span>
            {user.email} · {user.role}
          </span>
        </div>
        <nav aria-label="Разделы админки">
          <ul className="admin-nav">
            {LINKS.filter((link) => link.href !== '/admin/users' || user.role === 'admin').map(
              (link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ),
            )}
          </ul>
        </nav>
        <div className="border-t border-white/10 pt-3">
          <LogoutButton />
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

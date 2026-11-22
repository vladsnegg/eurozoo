'use client';

import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="text-left text-sm"
      onClick={async () => {
        await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
        router.replace('/login');
        router.refresh();
      }}
    >
      Выйти
    </button>
  );
}

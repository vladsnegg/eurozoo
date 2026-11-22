import { PageHeader } from '@/components/page';
import { UserRow } from '@/components/admin/user-row';
import { serverApi } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

type User = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

export default async function AdminUsersPage() {
  const users = await serverApi<User[]>('/admin/users');

  return (
    <>
      <PageHeader
        eyebrow="Куратор"
        title="Пользователи"
        description="Роли: viewer — чтение, editor — контент, admin — удаление и управление доступом."
      />

      <div className="table-wrap">
        <table className="data-table">
          <caption className="sr-only">Пользователи системы</caption>
          <thead>
            <tr>
              <th scope="col">Email</th>
              <th scope="col">Имя</th>
              <th scope="col">Роль</th>
              <th scope="col">Статус</th>
              <th scope="col">Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={{
                  id: user.id,
                  email: user.email,
                  displayName: user.displayName,
                  role: user.role,
                  isActive: user.isActive,
                }}
              />
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-muted">
        Создание пользователей и смена пароля выполняются через API <code>POST /admin/users</code>.
        Нельзя деактивировать последнего администратора.
      </p>
    </>
  );
}

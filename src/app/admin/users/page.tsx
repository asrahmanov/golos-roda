import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { formatDate, initials, timeAgo } from '@/lib/utils';
import { createUserAction, resetPasswordAction, toggleAdminAction, toggleBlockUserAction } from '@/actions/admin';
import { ConfirmButton, SubmitButton } from '@/components/ui/Form';
import { ActionForm } from '@/components/admin/ActionForm';

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const admin = await requireAdmin();
  const { q } = await searchParams;
  const users = await db.user.findMany({
    where: q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] } : {},
    include: { _count: { select: { memberships: true, materials: true } } },
    orderBy: { createdAt: 'desc' },
    take: 300,
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Аккаунты</p>
          <h1 className="h-display mt-2 text-4xl">Пользователи</h1>
        </div>
        <form className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="Имя или почта" className="input py-2" />
          <button className="btn-dark btn-sm">Найти</button>
        </form>
      </div>

      <details className="card p-6">
        <summary className="cursor-pointer font-semibold">+ Создать пользователя (например, волонтёра или члена команды)</summary>
        <ActionForm action={createUserAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-center" resetOnSuccess>
          <input name="name" placeholder="Имя" required className="input" />
          <input name="email" type="email" placeholder="Почта" required className="input" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="admin" className="h-4 w-4 accent-gold-600" /> админ</label>
          <SubmitButton className="btn-gold btn-sm">Создать</SubmitButton>
        </ActionForm>
      </details>

      <div className="card divide-y divide-ink-900/6 overflow-hidden">
        {users.map((u) => (
          <div key={u.id} className="grid gap-4 p-5 lg:grid-cols-[1.5fr_1fr_auto] lg:items-center">
            <div className="flex items-center gap-3">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold ${u.role === 'ADMIN' ? 'bg-gold-500 text-ink-950' : 'bg-ink-900 text-gold-300'}`}>{initials(u.name)}</span>
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {u.name}
                  {u.role === 'ADMIN' && <span className="chip ml-2 bg-gold-500/15 text-gold-700">админ</span>}
                  {u.isBlocked && <span className="chip ml-2 bg-rose-500/12 text-rose-500">заблокирован</span>}
                </p>
                <p className="truncate text-sm text-ink-500">{u.email}{u.phone && ` · ${u.phone}`}</p>
              </div>
            </div>
            <p className="text-xs text-ink-500">
              С {formatDate(u.createdAt)} · {u.lastSeenAt ? `был(а) ${timeAgo(u.lastSeenAt)}` : 'не заходил(а)'}
              <br />
              Семей: {u._count.memberships} · материалов: {u._count.materials}
            </p>
            {u.id !== admin.id ? (
              <div className="flex flex-wrap items-start gap-2">
                <ActionForm action={resetPasswordAction} className="max-w-xs">
                  <input type="hidden" name="id" value={u.id} />
                  <SubmitButton className="btn-ghost btn-sm" pendingText="…">Сбросить пароль</SubmitButton>
                </ActionForm>
                <form action={toggleBlockUserAction}>
                  <input type="hidden" name="id" value={u.id} />
                  <ConfirmButton message={u.isBlocked ? 'Разблокировать пользователя?' : 'Заблокировать пользователя? Он сразу выйдет из аккаунта.'} className="btn-ghost btn-sm">
                    {u.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                  </ConfirmButton>
                </form>
                <form action={toggleAdminAction}>
                  <input type="hidden" name="id" value={u.id} />
                  <ConfirmButton message={u.role === 'ADMIN' ? 'Снять права администратора?' : 'Выдать права администратора?'} className="btn-ghost btn-sm">
                    {u.role === 'ADMIN' ? 'Снять админа' : 'Сделать админом'}
                  </ConfirmButton>
                </form>
              </div>
            ) : (
              <span className="text-xs text-ink-400">это вы</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

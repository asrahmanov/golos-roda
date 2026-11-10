import { ShieldCheck, UserMinus } from 'lucide-react';
import { db } from '@/lib/db';
import { requireFamily, ROLE_HINT, ROLE_LABEL } from '@/lib/family';
import { formatDate, initials, timeAgo } from '@/lib/utils';
import { removeMemberAction, revokeInviteAction } from '@/actions/family';
import { ConfirmButton } from '@/components/ui/Form';
import { CreateInviteForm, InviteLink, RoleSelect } from '@/components/app/MemberWidgets';

export default async function MembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, role, family } = await requireFamily(id);
  const isOwner = role === 'OWNER';
  const [members, invites] = await Promise.all([
    db.membership.findMany({ where: { familyId: id }, include: { user: { select: { id: true, name: true, email: true, lastSeenAt: true } } }, orderBy: [{ role: 'asc' }, { createdAt: 'asc' }] }),
    isOwner ? db.invite.findMany({ where: { familyId: id, revoked: false, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } }) : Promise.resolve([]),
  ]);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      <section className="card p-6 sm:p-8">
        <h2 className="font-serif text-2xl font-semibold">Участники <span className="text-ink-300">{members.length}</span></h2>
        <ul className="mt-6 divide-y divide-ink-900/6">
          {members.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-4 py-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink-900 text-sm font-bold text-gold-300">{initials(m.user.name)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{m.user.name} {m.user.id === user.id && <span className="text-ink-400">(вы)</span>}</p>
                <p className="truncate text-xs text-ink-400">
                  {isOwner ? m.user.email : ROLE_LABEL[m.role]}
                  {m.user.lastSeenAt && ` · был(а) ${timeAgo(m.user.lastSeenAt)}`}
                </p>
              </div>
              {isOwner ? (
                <div className="flex items-center gap-2">
                  <RoleSelect id={m.id} role={m.role} />
                  {m.user.id !== user.id && (
                    <form action={removeMemberAction}>
                      <input type="hidden" name="id" value={m.id} />
                      <ConfirmButton message={`Исключить ${m.user.name} из семейного пространства?`} className="grid h-9 w-9 place-items-center rounded-xl text-ink-400 hover:bg-rose-500/10 hover:text-rose-500">
                        <UserMinus className="h-4 w-4" />
                      </ConfirmButton>
                    </form>
                  )}
                </div>
              ) : (
                <span className="chip bg-cream-100 text-ink-600">{ROLE_LABEL[m.role]}</span>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-6 grid gap-3 rounded-2xl bg-cream-100 p-5 text-sm">
          {(['OWNER', 'EDITOR', 'VIEWER'] as const).map((r) => (
            <p key={r}><span className="font-semibold">{ROLE_LABEL[r]}</span> — <span className="text-ink-600">{ROLE_HINT[r]}</span></p>
          ))}
        </div>
      </section>

      <div className="space-y-6">
        {isOwner ? (
          <>
            <section className="card p-6 sm:p-8">
              <h2 className="font-serif text-2xl font-semibold">Пригласить родственников</h2>
              <p className="mt-2 text-sm text-ink-500">Создайте ссылку и отправьте её в мессенджере. Войти смогут только те, у кого есть ссылка.</p>
              <div className="mt-6"><CreateInviteForm familyId={id} /></div>
            </section>
            {invites.length > 0 && (
              <section className="card p-6 sm:p-8">
                <h3 className="font-serif text-xl font-semibold">Активные ссылки</h3>
                <ul className="mt-4 space-y-5">
                  {invites.map((inv) => (
                    <li key={inv.id} className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span>
                          <span className="font-semibold">{inv.note || 'Без заметки'}</span>{' '}
                          <span className="text-ink-400">· {ROLE_LABEL[inv.role]} · {inv.usedCount}/{inv.maxUses} · до {formatDate(inv.expiresAt)}</span>
                        </span>
                        <form action={revokeInviteAction}>
                          <input type="hidden" name="id" value={inv.id} />
                          <button className="text-xs font-semibold text-rose-500 hover:underline">Отозвать</button>
                        </form>
                      </div>
                      <InviteLink token={inv.token} familyName={family.name} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        ) : (
          <section className="rounded-3xl bg-ink-900 p-8 text-cream-50">
            <ShieldCheck className="h-8 w-8 text-gold-400" />
            <p className="mt-4 font-serif text-xl">Приглашать новых участников может хранитель пространства.</p>
          </section>
        )}
      </div>
    </div>
  );
}

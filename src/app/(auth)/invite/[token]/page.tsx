import type { Metadata } from 'next';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { ROLE_HINT, ROLE_LABEL } from '@/lib/family';
import { acceptInviteAction } from '@/actions/family';
import { SubmitButton } from '@/components/ui/Form';

export const metadata: Metadata = { title: 'Приглашение в семью', robots: { index: false } };

export default async function InvitePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  const { token } = await params;
  const sp = await searchParams;
  const [inv, user] = await Promise.all([
    db.invite.findUnique({ where: { token }, include: { family: { select: { name: true } }, createdBy: { select: { name: true } } } }),
    getCurrentUser(),
  ]);
  const valid = inv && !inv.revoked && inv.expiresAt > new Date() && inv.usedCount < inv.maxUses;

  if (!valid || sp.error) {
    return (
      <div>
        <h1 className="h-display text-4xl">Приглашение недействительно</h1>
        <p className="mt-3 text-ink-500">Срок действия ссылки истёк или её отозвали. Попросите родственника прислать новую.</p>
        <Link href="/" className="btn-gold mt-8">На главную</Link>
      </div>
    );
  }
  const next = `/invite/${token}`;
  return (
    <div>
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-ink-900 text-gold-400"><Users className="h-7 w-7" /></span>
      <p className="eyebrow mt-8">Приглашение</p>
      <h1 className="h-display mt-3 text-4xl sm:text-5xl">{inv.family.name}</h1>
      <p className="mt-4 text-ink-600">
        {inv.createdBy.name} приглашает вас в семейное пространство как <b>{ROLE_LABEL[inv.role].toLowerCase()}</b>. {ROLE_HINT[inv.role]}.
      </p>
      {user ? (
        <form action={acceptInviteAction} className="mt-10">
          <input type="hidden" name="token" value={token} />
          <p className="mb-4 text-sm text-ink-500">Вы вошли как {user.name}</p>
          <SubmitButton className="btn-gold w-full py-4" pendingText="Присоединяемся…">Присоединиться к семье</SubmitButton>
        </form>
      ) : (
        <div className="mt-10 grid gap-3">
          <Link href={`/register?next=${encodeURIComponent(next)}`} className="btn-gold py-4">Зарегистрироваться и присоединиться</Link>
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="btn-ghost py-4">У меня уже есть аккаунт</Link>
        </div>
      )}
    </div>
  );
}

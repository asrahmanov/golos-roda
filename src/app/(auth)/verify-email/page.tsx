import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { MailCheck } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { logoutAction } from '@/actions/auth';
import { VerifyEmailForms } from '@/components/auth/AuthForms';

export const metadata: Metadata = { title: 'Подтвердите почту' };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const { expired } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.emailVerifiedAt) redirect('/app');
  return (
    <>
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gold-400/15 text-gold-600">
        <MailCheck className="h-8 w-8" strokeWidth={1.5} />
      </span>
      <h1 className="h-display mt-8 text-4xl sm:text-5xl">Проверьте почту</h1>
      {expired ? (
        <p className="mt-4 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-500">Ссылка устарела. Отправьте письмо ещё раз.</p>
      ) : null}
      <p className="mt-4 leading-relaxed text-ink-600">
        Мы отправили письмо на <b className="text-ink-900">{user.email}</b>. Откройте его и нажмите «Подтвердить почту» — после этого откроется ваш кабинет.
      </p>
      <p className="mt-3 text-sm text-ink-500">Письмо может прийти в течение пары минут. Если его нет — загляните в «Спам» или «Промоакции».</p>
      <div className="mt-10">
        <VerifyEmailForms email={user.email} />
      </div>
      <form action={logoutAction} className="mt-8 text-center">
        <button className="text-sm text-ink-400 hover:text-ink-700">Выйти</button>
      </form>
    </>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { findValidToken } from '@/lib/email-tokens';
import { ResetForm } from '@/components/auth/AuthForms';

export const metadata: Metadata = { title: 'Новый пароль' };

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const row = await findValidToken(token, 'RESET');
  if (!row) {
    return (
      <>
        <h1 className="h-display text-4xl sm:text-5xl">Ссылка устарела</h1>
        <p className="mt-3 text-ink-500">Ссылка для смены пароля действует 2 часа и только один раз.</p>
        <Link href="/forgot" className="btn-dark mt-10 w-full py-4">Запросить новую ссылку</Link>
      </>
    );
  }
  return (
    <>
      <h1 className="h-display text-4xl sm:text-5xl">Новый пароль</h1>
      <p className="mt-3 text-ink-500">Для аккаунта {row.user.email}</p>
      <div className="mt-10"><ResetForm token={token} /></div>
    </>
  );
}

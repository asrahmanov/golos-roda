import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { LoginForm } from '@/components/auth/AuthForms';

export const metadata: Metadata = { title: 'Вход' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; verify?: string }> }) {
  const { next, verify } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(next && next.startsWith('/') ? next : '/app');
  return (
    <>
      <h1 className="h-display text-4xl sm:text-5xl">С возвращением</h1>
      <p className="mt-3 text-ink-500">Войдите, чтобы продолжить семейную летопись.</p>
      {verify === 'done' && (
        <p className="mt-6 rounded-2xl bg-sage-500/12 px-4 py-3 text-sm text-sage-500">Почта уже подтверждена — войдите, чтобы продолжить.</p>
      )}
      {verify === 'invalid' && (
        <p className="mt-6 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-500">Ссылка недействительна. Войдите — и мы предложим отправить письмо заново.</p>
      )}
      <div className="mt-10"><LoginForm next={next} /></div>
    </>
  );
}

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { LoginForm } from '@/components/auth/AuthForms';

export const metadata: Metadata = { title: 'Вход' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(next && next.startsWith('/') ? next : '/app');
  return (
    <>
      <h1 className="h-display text-4xl sm:text-5xl">С возвращением</h1>
      <p className="mt-3 text-ink-500">Войдите, чтобы продолжить семейную летопись.</p>
      <div className="mt-10"><LoginForm next={next} /></div>
    </>
  );
}

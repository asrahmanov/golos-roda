import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { RegisterForm } from '@/components/auth/AuthForms';

export const metadata: Metadata = { title: 'Регистрация' };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect(next && next.startsWith('/') ? next : '/app');
  return (
    <>
      <h1 className="h-display text-4xl sm:text-5xl">Начнём историю вашей семьи</h1>
      <p className="mt-3 text-ink-500">Бесплатно. Семейное пространство закрыто — его видят только те, кого вы пригласите.</p>
      <div className="mt-10"><RegisterForm next={next} /></div>
    </>
  );
}

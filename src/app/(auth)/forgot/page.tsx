import type { Metadata } from 'next';
import { ForgotForm } from '@/components/auth/AuthForms';

export const metadata: Metadata = { title: 'Восстановление пароля' };

export default function ForgotPage() {
  return (
    <>
      <h1 className="h-display text-4xl sm:text-5xl">Забыли пароль?</h1>
      <p className="mt-3 text-ink-500">Укажите почту, с которой регистрировались, — пришлём ссылку для смены пароля.</p>
      <div className="mt-10"><ForgotForm /></div>
    </>
  );
}

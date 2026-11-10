'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { loginAction, registerAction } from '@/actions/auth';
import { Field, FormMessage, SubmitButton } from '@/components/ui/Form';

function PasswordInput({ name, autoComplete }: { name: string; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input name={name} type={show ? 'text' : 'password'} required minLength={8} autoComplete={autoComplete} className="input pr-12" />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-ink-400 hover:text-ink-700" aria-label={show ? 'Скрыть пароль' : 'Показать пароль'}>
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next ?? ''} />
      <Field label="Электронная почта">
        <input name="email" type="email" required autoComplete="email" className="input" />
      </Field>
      <Field label="Пароль">
        <PasswordInput name="password" autoComplete="current-password" />
      </Field>
      <FormMessage state={state} />
      <SubmitButton className="btn-dark mt-2 w-full py-4" pendingText="Входим…">Войти</SubmitButton>
      <p className="text-center text-sm text-ink-500">
        Нет аккаунта?{' '}
        <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-semibold text-gold-700 hover:underline">
          Зарегистрироваться
        </Link>
      </p>
      <p className="text-center text-xs text-ink-400">Забыли пароль? Напишите в поддержку — администратор поможет восстановить доступ.</p>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [state, action] = useActionState(registerAction, undefined);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next ?? ''} />
      <Field label="Как вас зовут">
        <input name="name" required autoComplete="name" className="input" placeholder="Имя и фамилия" />
      </Field>
      <Field label="Электронная почта">
        <input name="email" type="email" required autoComplete="email" className="input" />
      </Field>
      <Field label="Пароль" hint="Не короче 8 символов">
        <PasswordInput name="password" autoComplete="new-password" />
      </Field>
      <label className="flex items-start gap-3 text-sm text-ink-600">
        <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 accent-gold-600" />
        <span>
          Принимаю{' '}
          <Link href="/terms" target="_blank" className="text-gold-700 underline">условия использования</Link> и{' '}
          <Link href="/privacy" target="_blank" className="text-gold-700 underline">политику конфиденциальности</Link>
        </span>
      </label>
      <FormMessage state={state} />
      <SubmitButton className="btn-gold mt-2 w-full py-4" pendingText="Создаём…">Создать аккаунт</SubmitButton>
      <p className="text-center text-sm text-ink-500">
        Уже есть аккаунт?{' '}
        <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-semibold text-gold-700 hover:underline">
          Войти
        </Link>
      </p>
    </form>
  );
}

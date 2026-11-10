'use client';

import { useActionState } from 'react';
import { changePasswordAction, updateProfileAction } from '@/actions/auth';
import { createTicketAction, deleteAccountAction } from '@/actions/family';
import { Field, FormMessage, SubmitButton } from '@/components/ui/Form';

export function ProfileForm({ name, phone, email }: { name: string; phone: string | null; email: string }) {
  const [state, action] = useActionState(updateProfileAction, undefined);
  return (
    <form action={action} className="grid gap-4">
      <Field label="Почта"><input value={email} disabled className="input bg-cream-100 text-ink-500" /></Field>
      <Field label="Имя"><input name="name" defaultValue={name} required className="input" /></Field>
      <Field label="Телефон"><input name="phone" defaultValue={phone ?? ''} type="tel" className="input" /></Field>
      <FormMessage state={state} />
      <SubmitButton className="btn-dark w-fit">Сохранить</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePasswordAction, undefined);
  return (
    <form action={action} className="grid gap-4">
      <Field label="Текущий пароль"><input name="current" type="password" required autoComplete="current-password" className="input" /></Field>
      <Field label="Новый пароль" hint="Не короче 8 символов"><input name="next" type="password" required minLength={8} autoComplete="new-password" className="input" /></Field>
      <FormMessage state={state} />
      <SubmitButton className="btn-dark w-fit">Изменить пароль</SubmitButton>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action] = useActionState(deleteAccountAction, undefined);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={(e) => { if (!confirm('Удалить учётную запись безвозвратно?')) e.preventDefault(); }}>
      <input name="password" type="password" required placeholder="Пароль для подтверждения" className="input" />
      <SubmitButton className="btn bg-rose-500 text-white hover:bg-rose-500/90">Удалить аккаунт</SubmitButton>
      <div className="sm:col-span-2"><FormMessage state={state} /></div>
    </form>
  );
}

export function TicketForm() {
  const [state, action] = useActionState(createTicketAction, undefined);
  return (
    <form action={action} className="grid gap-4">
      <Field label="Тема"><input name="subject" required className="input" placeholder="Например: не загружается видео" /></Field>
      <Field label="Сообщение"><textarea name="message" required rows={5} className="input" /></Field>
      <FormMessage state={state} />
      <SubmitButton className="btn-gold w-fit">Отправить</SubmitButton>
    </form>
  );
}

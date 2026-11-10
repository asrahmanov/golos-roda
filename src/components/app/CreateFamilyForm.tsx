'use client';

import { useActionState } from 'react';
import { createFamilyAction } from '@/actions/family';
import { Field, FormMessage, SubmitButton } from '@/components/ui/Form';

export function CreateFamilyForm({ defaultLastName }: { defaultLastName?: string }) {
  const [state, action] = useActionState(createFamilyAction, undefined);
  return (
    <form action={action} className="grid gap-5">
      <Field label="Название семейного пространства" hint="Его увидят только приглашённые родственники">
        <input name="name" required className="input" placeholder={defaultLastName ? `Семья ${defaultLastName}` : 'Семья Ивановых'} />
      </Field>
      <Field label="Описание (необязательно)">
        <textarea name="description" rows={2} className="input resize-none" placeholder="Например: история рода по маминой линии" />
      </Field>
      <div className="rounded-2xl bg-cream-100 p-5">
        <p className="text-sm font-semibold">С кого начнём дерево?</p>
        <p className="mt-1 text-xs text-ink-500">Обычно удобно начать с себя — потом добавить родителей, бабушек и дедушек.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input name="firstName" className="input" placeholder="Ваше имя" />
          <input name="lastName" className="input" placeholder="Фамилия" defaultValue={defaultLastName} />
          <input name="birthDate" className="input" placeholder="Год или дата рождения" />
          <select name="gender" className="input" defaultValue="UNKNOWN">
            <option value="UNKNOWN">Пол не указан</option>
            <option value="FEMALE">Женский</option>
            <option value="MALE">Мужской</option>
          </select>
        </div>
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-gold py-4" pendingText="Создаём…">Создать семейное пространство</SubmitButton>
    </form>
  );
}

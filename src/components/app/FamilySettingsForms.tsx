'use client';

import { useActionState, useState } from 'react';
import { updateFamilyAction } from '@/actions/family';
import { Field, FormMessage, SubmitButton } from '@/components/ui/Form';

export function FamilyEditForm({ id, name, description }: { id: string; name: string; description: string | null }) {
  const [state, action] = useActionState(updateFamilyAction, undefined);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="familyId" value={id} />
      <Field label="Название"><input name="name" defaultValue={name} required className="input" /></Field>
      <Field label="Описание"><textarea name="description" defaultValue={description ?? ''} rows={3} className="input resize-none" /></Field>
      <FormMessage state={state} />
      <SubmitButton className="btn-dark w-fit">Сохранить</SubmitButton>
    </form>
  );
}

export function DeleteConfirmInput({ name }: { name: string }) {
  const [v, setV] = useState('');
  return (
    <>
      <input name="confirm" value={v} onChange={(e) => setV(e.target.value)} placeholder={name} className="input" />
      <button type="submit" disabled={v !== name} className="btn bg-rose-500 text-white hover:bg-rose-500/90">Удалить навсегда</button>
    </>
  );
}

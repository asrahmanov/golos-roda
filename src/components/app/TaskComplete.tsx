'use client';

import { useActionState } from 'react';
import { completeTaskAction } from '@/actions/family';
import { FormMessage, SubmitButton } from '@/components/ui/Form';

export function TaskCompleteForm({ familyId, taskId }: { familyId: string; taskId: string }) {
  const [state, action] = useActionState(completeTaskAction, undefined);
  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="familyId" value={familyId} />
      <input type="hidden" name="taskId" value={taskId} />
      <textarea name="note" rows={2} placeholder="Что удалось узнать? (необязательно)" className="input resize-none text-sm" />
      <FormMessage state={state} />
      <SubmitButton className="btn-ghost btn-sm w-fit">Отметить выполненным без материала</SubmitButton>
    </form>
  );
}

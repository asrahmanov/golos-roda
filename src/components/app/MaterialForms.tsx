'use client';

import { useActionState, useEffect, useRef } from 'react';
import { addCommentAction, submitStoryAction, updateMaterialAction } from '@/actions/family';
import { Field, FormMessage, SubmitButton } from '@/components/ui/Form';

export function MaterialEditForm({
  m,
  persons,
  selected,
  canChangeVisibility,
}: {
  m: { id: string; title: string; body: string | null; dateText: string | null; place: string | null; visibility: string };
  persons: { id: string; name: string }[];
  selected: string[];
  canChangeVisibility: boolean;
}) {
  const [state, action] = useActionState(updateMaterialAction, undefined);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="id" value={m.id} />
      <Field label="Название"><input name="title" defaultValue={m.title} required className="input" /></Field>
      <Field label="Текст / подпись"><textarea name="body" defaultValue={m.body ?? ''} rows={5} className="input" /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Когда"><input name="dateText" defaultValue={m.dateText ?? ''} className="input" /></Field>
        <Field label="Где"><input name="place" defaultValue={m.place ?? ''} className="input" /></Field>
      </div>
      <fieldset>
        <legend className="label">Родственники</legend>
        <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
          {persons.map((p) => (
            <label key={p.id} className="cursor-pointer">
              <input type="checkbox" name="personIds" value={p.id} defaultChecked={selected.includes(p.id)} className="peer sr-only" />
              <span className="chip border border-ink-900/12 text-ink-600 peer-checked:border-ink-900 peer-checked:bg-ink-900 peer-checked:text-cream-50">{p.name}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {canChangeVisibility && (
        <Field label="Кто видит">
          <select name="visibility" defaultValue={m.visibility} className="input">
            <option value="FAMILY">Вся семья</option>
            <option value="EDITORS">Только хранители и соавторы</option>
            <option value="PRIVATE">Только я</option>
          </select>
        </Field>
      )}
      <FormMessage state={state} />
      <SubmitButton className="btn-dark w-fit">Сохранить</SubmitButton>
    </form>
  );
}

export function CommentForm({ materialId }: { materialId: string }) {
  const [state, action] = useActionState(addCommentAction, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="grid gap-2">
      <input type="hidden" name="materialId" value={materialId} />
      <textarea name="text" rows={2} required placeholder="Дополните историю, уточните детали…" className="input resize-none" />
      {state?.error && <FormMessage state={state} />}
      <SubmitButton className="btn-dark btn-sm w-fit" pendingText="…">Отправить</SubmitButton>
    </form>
  );
}

export function SubmitStoryForm({ familyId, materialId, title, text, authorName }: { familyId: string; materialId?: string; title?: string; text?: string; authorName: string }) {
  const [state, action] = useActionState(submitStoryAction, undefined);
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="familyId" value={familyId} />
      {materialId && <input type="hidden" name="materialId" value={materialId} />}
      <Field label="Заголовок"><input name="title" defaultValue={title} required className="input" /></Field>
      <Field label="Текст истории" hint="Проверьте, что в тексте нет сведений, которые родственники не хотели бы публиковать">
        <textarea name="text" defaultValue={text} rows={7} required className="input" />
      </Field>
      <Field label="Подпись автора"><input name="authorName" defaultValue={authorName} className="input" placeholder="Например: семья Ивановых, Москва" /></Field>
      <label className="flex items-start gap-3 text-sm text-ink-600">
        <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 accent-gold-600" />
        Я подтверждаю, что имею право публиковать эту историю и изображение, и согласен(на) на их публикацию на сайте проекта
      </label>
      <FormMessage state={state} />
      <SubmitButton className="btn-gold w-fit">Отправить на модерацию</SubmitButton>
    </form>
  );
}

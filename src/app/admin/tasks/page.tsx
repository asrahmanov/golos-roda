import { Trash2 } from 'lucide-react';
import type { Task } from '@prisma/client';
import { db } from '@/lib/db';
import { MATERIAL_LABEL, TASK_ICONS } from '@/lib/constants';
import { deleteTaskAction, saveTaskAction } from '@/actions/admin';
import { ConfirmButton, SubmitButton } from '@/components/ui/Form';
import { ActionForm } from '@/components/admin/ActionForm';
import { TaskIcon } from '@/components/ui/TaskIcon';

function TaskFields({ t }: { t?: Task }) {
  return (
    <>
      {t && <input type="hidden" name="id" value={t.id} />}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <input name="title" defaultValue={t?.title} required placeholder="Название, например «Расспросите старших о детстве»" className="input" />
        <input name="order" type="number" defaultValue={t?.order ?? 0} className="input sm:w-24" title="Порядок" />
      </div>
      <textarea name="description" defaultValue={t?.description} required rows={3} placeholder="Описание и подсказки: какие вопросы задать, что сфотографировать" className="input" />
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="label">Иконка</span>
          <select name="icon" defaultValue={t?.icon ?? 'sparkles'} className="input">
            {TASK_ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="label">Тип материала</span>
          <select name="hint" defaultValue={t?.hint ?? ''} className="input">
            <option value="">Любой</option>
            {Object.entries(MATERIAL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="label">Действует до</span>
          <input name="endsAt" type="date" defaultValue={t?.endsAt ? t.endsAt.toISOString().slice(0, 10) : ''} className="input" />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isPublished" defaultChecked={t?.isPublished ?? true} className="h-4 w-4 accent-gold-600" /> Опубликовано</label>
    </>
  );
}

export default async function TasksAdminPage() {
  const tasks = await db.task.findMany({ include: { _count: { select: { completions: true } } }, orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] });
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Социальная программа</p>
        <h1 className="h-display mt-2 text-4xl">Цифровые задания</h1>
        <p className="mt-2 text-sm text-ink-500">Задания видны всем семьям в кабинете и на главной странице. Рекомендуемая частота — раз в месяц.</p>
      </div>
      <section className="card p-6">
        <h2 className="font-serif text-xl font-semibold">Новое задание</h2>
        <ActionForm action={saveTaskAction} className="mt-4 grid gap-3" resetOnSuccess>
          <TaskFields />
          <SubmitButton className="btn-gold w-fit">Создать</SubmitButton>
        </ActionForm>
      </section>
      <div className="grid gap-4">
        {tasks.map((t) => (
          <details key={t.id} className="card group p-5">
            <summary className="flex cursor-pointer list-none items-center gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-gold-700"><TaskIcon name={t.icon} className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{t.title}</span>
                <span className="block text-xs text-ink-400">выполнили семей: {t._count.completions}{!t.isPublished && ' · скрыто'}</span>
              </span>
              <span className="text-xs text-gold-700 group-open:hidden">изменить</span>
            </summary>
            <ActionForm action={saveTaskAction} className="mt-5 grid gap-3">
              <TaskFields t={t} />
              <SubmitButton className="btn-dark btn-sm w-fit">Сохранить</SubmitButton>
            </ActionForm>
            <form action={deleteTaskAction} className="mt-3">
              <input type="hidden" name="id" value={t.id} />
              <ConfirmButton message="Удалить задание вместе с отметками о выполнении?" className="btn btn-sm text-rose-500 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /> Удалить</ConfirmButton>
            </form>
          </details>
        ))}
      </div>
    </div>
  );
}

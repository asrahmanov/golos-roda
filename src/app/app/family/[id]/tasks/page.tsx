import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { db } from '@/lib/db';
import { canEdit, personShortName, requireFamily } from '@/lib/family';
import { formatDate, plural } from '@/lib/utils';
import { TaskIcon } from '@/components/ui/TaskIcon';
import { ProgressBar } from '@/components/ui/Motion';
import { MaterialUploader } from '@/components/app/MaterialUploader';
import { TaskCompleteForm } from '@/components/app/TaskComplete';

const TAB_FOR: Record<string, 'file' | 'memory' | 'voice' | 'link'> = { PHOTO: 'file', DOCUMENT: 'file', VIDEO: 'file', MEMORY: 'memory', AUDIO: 'voice', LINK: 'link' };

export default async function TasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { role } = await requireFamily(id);
  const editable = canEdit(role);
  const [tasks, done, persons] = await Promise.all([
    db.task.findMany({ where: { isPublished: true }, orderBy: [{ order: 'asc' }, { startsAt: 'desc' }] }),
    db.taskCompletion.findMany({ where: { familyId: id }, include: { user: { select: { name: true } }, material: { select: { id: true, title: true } } } }),
    db.person.findMany({ where: { familyId: id }, select: { id: true, firstName: true, lastName: true } }),
  ]);
  const doneMap = new Map(done.map((d) => [d.taskId, d]));
  const opts = persons.map((p) => ({ id: p.id, name: personShortName(p) }));

  return (
    <div className="space-y-8">
      <div className="grid gap-6 rounded-[2rem] bg-ink-900 p-6 text-cream-50 sm:p-10 md:grid-cols-[1.5fr_1fr] md:items-center">
        <div>
          <p className="eyebrow">Социальная программа</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">Семейные задания</h2>
          <p className="mt-3 text-cream-100/70">Добровольные задания — повод поговорить со старшими, открыть альбомы и пополнить летопись. Выполняйте в своём темпе.</p>
        </div>
        <div className="rounded-3xl bg-white/5 p-6">
          <p className="font-serif text-5xl font-semibold">{doneMap.size}<span className="text-2xl text-cream-100/40"> / {tasks.length}</span></p>
          <p className="mt-1 text-sm text-cream-100/60">{plural(doneMap.size, ['задание выполнено', 'задания выполнено', 'заданий выполнено'])}</p>
          <ProgressBar value={doneMap.size} max={tasks.length || 1} className="mt-4 text-cream-50" />
        </div>
      </div>

      {tasks.length === 0 && <p className="text-center text-ink-400">Задания скоро появятся.</p>}

      <div className="grid gap-5 lg:grid-cols-2">
        {tasks.map((t) => {
          const d = doneMap.get(t.id);
          return (
            <article id={t.id} key={t.id} className={`card scroll-mt-24 p-6 sm:p-8 ${d ? 'ring-2 ring-sage-500/40' : ''}`}>
              <div className="flex items-start gap-4">
                <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${d ? 'bg-sage-500 text-white' : 'bg-cream-100 text-ink-900'}`}>
                  {d ? <CheckCircle2 className="h-6 w-6" /> : <TaskIcon name={t.icon} className="h-8 w-8" />}
                </span>
                <div className="min-w-0">
                  <h3 className="font-serif text-2xl font-semibold leading-tight">{t.title}</h3>
                  {t.endsAt && <p className="mt-1 text-xs text-ink-400">до {formatDate(t.endsAt)}</p>}
                </div>
              </div>
              <p className="mt-4 whitespace-pre-line leading-relaxed text-ink-600">{t.description}</p>
              {d ? (
                <div className="mt-5 rounded-2xl bg-sage-500/10 p-4 text-sm">
                  <p className="font-semibold text-sage-500">Выполнено · {d.user?.name ?? 'участник'} · {formatDate(d.createdAt)}</p>
                  {d.material && <Link href={`/app/family/${id}/archive/${d.material.id}`} className="mt-1 block text-ink-700 underline">{d.material.title}</Link>}
                  {d.note && <p className="mt-1 text-ink-600">{d.note}</p>}
                </div>
              ) : editable ? (
                <div className="mt-6 space-y-4">
                  <MaterialUploader familyId={id} persons={opts} tasks={[{ id: t.id, name: t.title }]} defaultTaskId={t.id} defaultTab={TAB_FOR[t.hint ?? 'MEMORY']} label="Выполнить и добавить материал" className="btn-gold btn-sm" />
                  <details>
                    <summary className="cursor-pointer text-xs text-ink-400 hover:text-ink-700">Выполнили без материала?</summary>
                    <div className="mt-3"><TaskCompleteForm familyId={id} taskId={t.id} /></div>
                  </details>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}

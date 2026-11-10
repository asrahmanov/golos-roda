import Link from 'next/link';
import { db } from '@/lib/db';
import { canEdit, requireFamily } from '@/lib/family';
import { STORY_STATUS_LABEL } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { withdrawStoryAction } from '@/actions/family';
import { ConfirmButton } from '@/components/ui/Form';
import { SubmitStoryForm } from '@/components/app/MaterialForms';

export default async function FamilyStoriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, role } = await requireFamily(id);
  const stories = await db.publicStory.findMany({ where: { familyId: id }, include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } });
  const colors = { PENDING: 'bg-gold-500/15 text-gold-700', APPROVED: 'bg-sage-500/15 text-sage-500', REJECTED: 'bg-rose-500/12 text-rose-500' };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      <section>
        <div className="rounded-[2rem] bg-ink-900 p-6 text-cream-50 sm:p-8">
          <p className="eyebrow">«Истории, которые нас объединяют»</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold">Поделитесь историей с другими семьями</h2>
          <p className="mt-3 text-cream-100/70">
            Ваше пространство закрыто. Но если хотите вдохновить других — отправьте историю на публичную экспозицию. Её проверит модератор, а снять с публикации можно в любой момент.
          </p>
          <Link href="/stories" className="btn-ghost btn-sm mt-6 text-cream-50">Смотреть экспозицию</Link>
        </div>
        {canEdit(role) && (
          <div className="card mt-6 p-6 sm:p-8">
            <h3 className="font-serif text-xl font-semibold">Новая история</h3>
            <p className="mt-1 text-sm text-ink-500">Чтобы приложить фотографию, откройте её в архиве и нажмите «Поделиться на экспозиции».</p>
            <div className="mt-5"><SubmitStoryForm familyId={id} authorName={user.name} /></div>
          </div>
        )}
      </section>
      <section className="card p-6 sm:p-8">
        <h3 className="font-serif text-2xl font-semibold">Отправленные истории</h3>
        {stories.length === 0 ? (
          <p className="mt-4 text-ink-400">Пока ничего не отправлено.</p>
        ) : (
          <ul className="mt-5 divide-y divide-ink-900/6">
            {stories.map((s) => (
              <li key={s.id} className="py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`chip ${colors[s.status]}`}>{STORY_STATUS_LABEL[s.status]}</span>
                  <span className="text-xs text-ink-400">{formatDate(s.createdAt)} · {s.user?.name}</span>
                </div>
                <p className="mt-2 font-semibold">{s.status === 'APPROVED' ? <Link href={`/stories/${s.id}`} className="hover:underline">{s.title}</Link> : s.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-ink-500">{s.text}</p>
                {s.adminNote && <p className="mt-2 rounded-xl bg-cream-100 px-3 py-2 text-xs text-ink-600">Комментарий модератора: {s.adminNote}</p>}
                {s.user?.id === user.id && (
                  <form action={withdrawStoryAction} className="mt-2">
                    <input type="hidden" name="id" value={s.id} />
                    <ConfirmButton message="Снять историю с публикации и удалить заявку?" className="text-xs font-semibold text-rose-500 hover:underline">
                      {s.status === 'APPROVED' ? 'Снять с публикации' : 'Отозвать'}
                    </ConfirmButton>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

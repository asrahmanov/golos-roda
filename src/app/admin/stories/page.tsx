import Link from 'next/link';
import type { StoryStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { STORY_STATUS_LABEL } from '@/lib/constants';
import { fileUrl } from '@/lib/storage';
import { cn, formatDate } from '@/lib/utils';
import { moderateStoryAction } from '@/actions/admin';

const ST: StoryStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

export default async function StoriesModerationPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const status = ST.includes(sp.status as StoryStatus) ? (sp.status as StoryStatus) : 'PENDING';
  const [rows, counts] = await Promise.all([
    db.publicStory.findMany({ where: { status }, include: { user: { select: { name: true, email: true } }, image: true }, orderBy: { createdAt: 'desc' } }),
    db.publicStory.groupBy({ by: ['status'], _count: true }),
  ]);
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">«Истории, которые нас объединяют»</p>
        <h1 className="h-display mt-2 text-4xl">Модерация историй</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-500">Семьи отправляют истории сами, с явным согласием. Проверьте, что в тексте нет чувствительных сведений о третьих лицах. Можно поправить опечатки перед публикацией.</p>
      </div>
      <div className="flex gap-2">
        {ST.map((s) => (
          <Link key={s} href={`/admin/stories?status=${s}`} className={cn('chip px-4 py-2', status === s ? 'bg-ink-900 text-cream-50' : 'bg-white text-ink-600')}>
            {STORY_STATUS_LABEL[s]} <span className="opacity-60">{counts.find((c) => c.status === s)?._count ?? 0}</span>
          </Link>
        ))}
      </div>
      <div className="grid gap-5">
        {rows.length === 0 && <p className="card p-10 text-center text-ink-400">Здесь пусто</p>}
        {rows.map((s) => (
          <form key={s.id} action={moderateStoryAction} className="card grid gap-5 p-6 lg:grid-cols-[240px_1fr]">
            <input type="hidden" name="id" value={s.id} />
            <div>
              {s.imageId ? (
                <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-cream-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fileUrl(s.imageId, true)!} alt={s.image?.originalName ?? ''} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="grid aspect-[4/3] place-items-center rounded-2xl bg-cream-100 font-serif text-5xl text-gold-400">“</div>
              )}
              <p className="mt-3 text-xs text-ink-400">{s.user?.name} · {s.user?.email}<br />{formatDate(s.createdAt, true)}</p>
            </div>
            <div className="grid gap-3">
              <input name="title" defaultValue={s.title} className="input font-semibold" />
              <textarea name="text" defaultValue={s.text} rows={7} className="input text-sm" />
              <p className="text-sm text-ink-500">Подпись: <b>{s.authorName}</b> · согласие на публикацию: {s.consent ? 'да' : 'нет'}</p>
              <input name="adminNote" defaultValue={s.adminNote ?? ''} placeholder="Комментарий для автора (виден в кабинете семьи)" className="input text-sm" />
              <div className="flex flex-wrap gap-2">
                <button name="decision" value="approve" className="btn-gold btn-sm">{s.status === 'APPROVED' ? 'Сохранить правки' : 'Опубликовать'}</button>
                {s.status !== 'REJECTED' && <button name="decision" value="reject" className="btn-ghost btn-sm">{s.status === 'APPROVED' ? 'Снять с публикации' : 'Отклонить'}</button>}
                <button name="decision" value="delete" className="btn btn-sm text-rose-500 hover:bg-rose-500/10">Удалить</button>
              </div>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}

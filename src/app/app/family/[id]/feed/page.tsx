import Link from 'next/link';
import { Activity } from 'lucide-react';
import { db } from '@/lib/db';
import { requireFamily } from '@/lib/family';
import { formatDate, initials, timeAgo } from '@/lib/utils';

export default async function FeedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireFamily(id);
  const items = await db.activity.findMany({
    where: { familyId: id },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  const groups = new Map<string, typeof items>();
  for (const it of items) {
    const k = formatDate(it.createdAt);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(it);
  }

  return (
    <div className="mx-auto max-w-3xl">
      {items.length === 0 ? (
        <div className="grid place-items-center rounded-[2rem] bg-cream-100 p-16 text-center">
          <Activity className="h-10 w-10 text-gold-500" />
          <p className="mt-4 text-ink-500">Здесь будет хроника: кто и что добавил в семейную летопись.</p>
        </div>
      ) : (
        [...groups.entries()].map(([day, list]) => (
          <section key={day} className="mb-10">
            <h3 className="sticky top-16 z-10 -mx-2 bg-cream-50/90 px-2 py-2 text-xs font-bold uppercase tracking-[0.2em] text-gold-600 backdrop-blur">{day}</h3>
            <ol className="relative mt-3 space-y-1 border-l border-ink-900/10 pl-6">
              {list.map((a) => {
                const inner = (
                  <>
                    <span className="absolute -left-[2.15rem] top-3 grid h-7 w-7 place-items-center rounded-full bg-ink-900 text-[10px] font-bold text-gold-300 ring-4 ring-cream-50">
                      {initials(a.user?.name ?? '?')}
                    </span>
                    <span className="font-semibold">{a.user?.name ?? 'Участник'}</span> <span className="text-ink-600">{a.text}</span>
                    <span className="ml-2 text-xs text-ink-400">{timeAgo(a.createdAt)}</span>
                  </>
                );
                return (
                  <li key={a.id} className="relative">
                    {a.link ? (
                      <Link href={a.link} className="block rounded-2xl px-3 py-3 transition hover:bg-cream-100">{inner}</Link>
                    ) : (
                      <div className="px-3 py-3">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        ))
      )}
    </div>
  );
}

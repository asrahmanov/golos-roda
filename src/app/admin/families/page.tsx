import { Lock } from 'lucide-react';
import { db } from '@/lib/db';
import { TREE_MIN_PERSONS } from '@/lib/stats';
import { formatDate, formatSize, timeAgo } from '@/lib/utils';

export default async function FamiliesAdminPage() {
  const families = await db.family.findMany({
    include: {
      _count: { select: { persons: true, relations: true, materials: true, members: true, completions: true } },
      activities: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  const sizes = await db.storedFile.groupBy({ by: ['familyId'], _sum: { size: true } });
  const sizeOf = new Map(sizes.map((s) => [s.familyId, s._sum.size ?? 0]));
  const totalSize = sizes.reduce((a, s) => a + (s._sum.size ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Агрегированная статистика</p>
        <h1 className="h-display mt-2 text-4xl">Семейные пространства</h1>
        <p className="mt-3 flex max-w-2xl items-start gap-2 text-sm text-ink-500">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
          Показаны только количественные показатели. Содержимое деревьев и архивов администраторам недоступно — так требует концепция приватности проекта.
        </p>
        <p className="mt-2 text-sm text-ink-500">Всего: {families.length} · хранилище: {formatSize(totalSize)}</p>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-cream-100 text-left text-xs uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-5 py-3">Пространство</th>
              <th className="px-3 py-3">Создано</th>
              <th className="px-3 py-3 text-right">Людей</th>
              <th className="px-3 py-3 text-right">Связей</th>
              <th className="px-3 py-3 text-right">Материалов</th>
              <th className="px-3 py-3 text-right">Участников</th>
              <th className="px-3 py-3 text-right">Заданий</th>
              <th className="px-3 py-3 text-right">Объём</th>
              <th className="px-5 py-3">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-900/6">
            {families.map((f) => {
              const tree = f._count.persons >= TREE_MIN_PERSONS && f._count.relations > 0;
              return (
                <tr key={f.id}>
                  <td className="px-5 py-3">
                    <p className="font-semibold">{f.name}</p>
                    {f.activities[0] && <p className="text-xs text-ink-400">активность {timeAgo(f.activities[0].createdAt)}</p>}
                  </td>
                  <td className="px-3 py-3 text-ink-500">{formatDate(f.createdAt)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{f._count.persons}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{f._count.relations}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{f._count.materials}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{f._count.members}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{f._count.completions}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatSize(sizeOf.get(f.id) ?? 0)}</td>
                  <td className="px-5 py-3">
                    {tree ? <span className="chip bg-sage-500/15 text-sage-500">дерево</span> : f._count.persons > 0 ? <span className="chip bg-gold-500/15 text-gold-700">участник</span> : <span className="chip bg-cream-100 text-ink-400">пустое</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

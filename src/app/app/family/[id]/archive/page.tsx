import Link from 'next/link';
import type { MaterialType, Prisma } from '@prisma/client';
import { Archive, Search } from 'lucide-react';
import { db } from '@/lib/db';
import { canEdit, personShortName, requireFamily, visibilityFilter } from '@/lib/family';
import { MATERIAL_PLURAL } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { MaterialCard } from '@/components/app/MaterialCard';
import { MaterialUploader } from '@/components/app/MaterialUploader';

const TYPES: MaterialType[] = ['PHOTO', 'DOCUMENT', 'MEMORY', 'AUDIO', 'VIDEO', 'LINK'];

export default async function ArchivePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ type?: string; person?: string; q?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { user, role } = await requireFamily(id);
  const type = TYPES.includes(sp.type as MaterialType) ? (sp.type as MaterialType) : undefined;
  const where: Prisma.MaterialWhereInput = {
    familyId: id,
    AND: [
      visibilityFilter(role, user.id),
      ...(sp.q ? [{ OR: [{ title: { contains: sp.q, mode: 'insensitive' as const } }, { body: { contains: sp.q, mode: 'insensitive' as const } }, { place: { contains: sp.q, mode: 'insensitive' as const } }] }] : []),
    ],
    ...(type ? { type } : {}),
    ...(sp.person ? { persons: { some: { personId: sp.person } } } : {}),
  };
  const [materials, counts, persons, tasks] = await Promise.all([
    db.material.findMany({
      where,
      include: { file: { select: { mime: true, thumbPath: true } }, persons: { include: { person: { select: { firstName: true, lastName: true } } } }, _count: { select: { comments: true } } },
      orderBy: { createdAt: 'desc' },
      take: 300,
    }),
    db.material.groupBy({ by: ['type'], where: { familyId: id, ...visibilityFilter(role, user.id) }, _count: true }),
    db.person.findMany({ where: { familyId: id }, select: { id: true, firstName: true, lastName: true }, orderBy: { firstName: 'asc' } }),
    db.task.findMany({ where: { isPublished: true }, select: { id: true, title: true } }),
  ]);
  const countOf = (t: MaterialType) => counts.find((c) => c.type === t)?._count ?? 0;
  const total = counts.reduce((s, c) => s + c._count, 0);
  const link = (patch: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const merged = { type: sp.type, person: sp.person, q: sp.q, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) q.set(k, v);
    const s = q.toString();
    return `/app/family/${id}/archive${s ? `?${s}` : ''}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Link href={link({ type: undefined })} className={cn('chip shrink-0 px-4 py-2 text-sm', !type ? 'bg-ink-900 text-cream-50' : 'bg-cream-100 text-ink-600 hover:bg-cream-200')}>
            Всё <span className="opacity-60">{total}</span>
          </Link>
          {TYPES.map((t) => (
            <Link key={t} href={link({ type: t })} className={cn('chip shrink-0 px-4 py-2 text-sm', type === t ? 'bg-ink-900 text-cream-50' : 'bg-cream-100 text-ink-600 hover:bg-cream-200')}>
              {MATERIAL_PLURAL[t]} <span className="opacity-60">{countOf(t)}</span>
            </Link>
          ))}
        </div>
        {canEdit(role) && (
          <MaterialUploader familyId={id} persons={persons.map((p) => ({ id: p.id, name: personShortName(p) }))} tasks={tasks.map((t) => ({ id: t.id, name: t.title }))} />
        )}
      </div>
      <form className="flex flex-col gap-3 sm:flex-row">
        {type && <input type="hidden" name="type" value={type} />}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input name="q" defaultValue={sp.q} placeholder="Поиск по названию, тексту, месту" className="input pl-11" />
        </div>
        <select name="person" defaultValue={sp.person ?? ''} className="input sm:max-w-xs">
          <option value="">Все родственники</option>
          {persons.map((p) => <option key={p.id} value={p.id}>{personShortName(p)}</option>)}
        </select>
        <button className="btn-dark">Найти</button>
      </form>
      {materials.length === 0 ? (
        <div className="grid place-items-center rounded-[2rem] bg-cream-100 px-6 py-20 text-center">
          <Archive className="h-12 w-12 text-gold-500" strokeWidth={1.4} />
          <p className="mt-4 font-serif text-2xl font-semibold">{total ? 'Ничего не найдено' : 'Архив пока пуст'}</p>
          <p className="mt-2 max-w-md text-ink-500">Начните с самой старой семейной фотографии или запишите короткое воспоминание.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {materials.map((m) => <MaterialCard key={m.id} m={m} familyId={id} />)}
        </div>
      )}
    </div>
  );
}

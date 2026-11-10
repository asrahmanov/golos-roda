import Link from 'next/link';
import { Search, UserPlus } from 'lucide-react';
import { db } from '@/lib/db';
import { canEdit, personName, requireFamily } from '@/lib/family';
import { fileUrl } from '@/lib/storage';
import { initials, lifeYears, plural } from '@/lib/utils';
import { linkSelfAction } from '@/actions/family';

export default async function PeoplePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string; pick?: string }> }) {
  const { id } = await params;
  const { q = '', pick } = await searchParams;
  const { role, membership } = await requireFamily(id);
  const query = q.trim();
  const persons = await db.person.findMany({
    where: {
      familyId: id,
      ...(query
        ? {
            OR: [
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
              { middleName: { contains: query, mode: 'insensitive' } },
              { maidenName: { contains: query, mode: 'insensitive' } },
              { birthPlace: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: { _count: { select: { materials: true } } },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });

  return (
    <div className="space-y-6">
      {pick === 'me' && <div className="rounded-2xl bg-gold-500/10 px-5 py-3 text-sm">Найдите себя в списке и нажмите «Это я». Если вас ещё нет — добавьте карточку.</div>}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input name="q" defaultValue={q} placeholder="Имя, фамилия или место" className="input pl-11" />
          {pick && <input type="hidden" name="pick" value={pick} />}
        </form>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-500">{persons.length} {plural(persons.length, ['человек', 'человека', 'человек'])}</span>
          {canEdit(role) && (
            <Link href={`/app/family/${id}/person/new${pick === 'me' ? '?me=1' : ''}`} className="btn-dark btn-sm">
              <UserPlus className="h-4 w-4" /> Добавить
            </Link>
          )}
        </div>
      </div>
      {persons.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-ink-900/15 p-12 text-center text-ink-400">{query ? 'Никого не нашлось' : 'В дереве пока никого нет'}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {persons.map((p) => (
            <div key={p.id} className="card flex items-center gap-4 p-4 transition hover:shadow-xl">
              <Link href={`/app/family/${id}/person/${p.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                <span className={`grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-cream-200 font-serif font-semibold text-ink-500 ${p.isLiving ? '' : 'grayscale'}`}>
                  {p.avatarId ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fileUrl(p.avatarId, true)!} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials(`${p.firstName} ${p.lastName ?? ''}`)
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{personName(p)}</span>
                  <span className="block truncate text-xs text-ink-400">
                    {[lifeYears(p), p.birthPlace].filter(Boolean).join(' · ') || '—'}
                  </span>
                  {p._count.materials > 0 && <span className="mt-1 block text-xs font-semibold text-gold-700">{p._count.materials} {plural(p._count.materials, ['материал', 'материала', 'материалов'])}</span>}
                </span>
              </Link>
              {pick === 'me' && membership.personId !== p.id && (
                <form action={linkSelfAction}>
                  <input type="hidden" name="familyId" value={id} />
                  <input type="hidden" name="personId" value={p.id} />
                  <button className="btn-gold btn-sm">Это я</button>
                </form>
              )}
              {membership.personId === p.id && <span className="chip bg-gold-500 text-ink-950">я</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Briefcase, MapPin, Pencil, Plus, Trash2, Unlink, UserRound } from 'lucide-react';
import { db } from '@/lib/db';
import { canEdit, personName, personShortName, requireFamily, visibilityFilter } from '@/lib/family';
import { fileUrl } from '@/lib/storage';
import { initials, lifeYears } from '@/lib/utils';
import { deletePersonAction, linkSelfAction, removeRelationAction } from '@/actions/family';
import { ConfirmButton } from '@/components/ui/Form';
import { Paragraphs } from '@/components/ui/Paragraphs';
import { AddRelationForm, AvatarUpload } from '@/components/app/PersonWidgets';
import { MaterialCard } from '@/components/app/MaterialCard';
import { MaterialUploader } from '@/components/app/MaterialUploader';
import { PersonForm } from '@/components/app/PersonForm';

type P = { id: string; firstName: string; lastName: string | null; avatarId: string | null; birthDate: string | null; deathDate: string | null; isLiving: boolean };

function RelPerson({ p, familyId, label, relId, editable }: { p: P; familyId: string; label: string; relId?: string; editable: boolean }) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl p-2 transition hover:bg-cream-100">
      <Link href={`/app/family/${familyId}/person/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-cream-200 text-sm font-semibold text-ink-500">
          {p.avatarId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fileUrl(p.avatarId, true)!} alt="" className="h-full w-full object-cover" />
          ) : (
            initials(`${p.firstName} ${p.lastName ?? ''}`)
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold">{personShortName(p)}</span>
          <span className="block text-xs text-ink-400">{label}{lifeYears(p) ? ` · ${lifeYears(p)}` : ''}</span>
        </span>
      </Link>
      {editable && relId && (
        <form action={removeRelationAction}>
          <input type="hidden" name="id" value={relId} />
          <ConfirmButton message="Убрать эту связь? Карточки людей останутся." className="rounded-full p-2 text-ink-300 opacity-0 transition hover:bg-rose-500/10 hover:text-rose-500 group-hover:opacity-100 max-sm:opacity-100">
            <Unlink className="h-4 w-4" />
          </ConfirmButton>
        </form>
      )}
    </div>
  );
}

export default async function PersonPage({ params }: { params: Promise<{ id: string; pid: string }> }) {
  const { id, pid } = await params;
  const { user, role, membership } = await requireFamily(id);
  const person = await db.person.findFirst({ where: { id: pid, familyId: id } });
  if (!person) notFound();
  const editable = canEdit(role);

  const [rels, materials, all, tasks, linkedMembers] = await Promise.all([
    db.relation.findMany({ where: { familyId: id, OR: [{ fromId: pid }, { toId: pid }] }, include: { from: true, to: true } }),
    db.material.findMany({
      where: { familyId: id, persons: { some: { personId: pid } }, ...visibilityFilter(role, user.id) },
      include: { file: { select: { mime: true, thumbPath: true } }, persons: { include: { person: { select: { firstName: true, lastName: true } } } }, _count: { select: { comments: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    db.person.findMany({ where: { familyId: id }, select: { id: true, firstName: true, lastName: true }, orderBy: { firstName: 'asc' } }),
    db.task.findMany({ where: { isPublished: true }, select: { id: true, title: true } }),
    db.membership.findMany({ where: { familyId: id, personId: pid }, include: { user: { select: { name: true } } } }),
  ]);

  const parents = rels.filter((r) => r.type === 'PARENT' && r.toId === pid).map((r) => ({ p: r.from, relId: r.id }));
  const children = rels.filter((r) => r.type === 'PARENT' && r.fromId === pid).map((r) => ({ p: r.to, relId: r.id }));
  const spouses = rels.filter((r) => r.type === 'SPOUSE').map((r) => ({ p: r.fromId === pid ? r.to : r.from, relId: r.id }));
  const siblings = parents.length
    ? await db.person.findMany({
        where: { familyId: id, id: { not: pid }, relTo: { some: { type: 'PARENT', fromId: { in: parents.map((x) => x.p.id) } } } },
      })
    : [];
  const g = person.gender;
  const label = {
    parent: (p: P & { gender?: string }) => (p.gender === 'FEMALE' ? 'мама' : p.gender === 'MALE' ? 'папа' : 'родитель'),
    child: (p: P & { gender?: string }) => (p.gender === 'FEMALE' ? 'дочь' : p.gender === 'MALE' ? 'сын' : 'ребёнок'),
    spouse: (p: P & { gender?: string }) => (p.gender === 'FEMALE' ? 'жена' : p.gender === 'MALE' ? 'муж' : 'супруг(а)'),
    sibling: (p: P & { gender?: string }) => (p.gender === 'FEMALE' ? 'сестра' : p.gender === 'MALE' ? 'брат' : 'брат / сестра'),
  };
  const options = all.filter((p) => p.id !== pid).map((p) => ({ id: p.id, name: personShortName(p) }));
  const personOpts = all.map((p) => ({ id: p.id, name: personShortName(p) }));

  return (
    <div className="space-y-8">
      <Link href={`/app/family/${id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" /> К дереву
      </Link>

      <section className="relative overflow-hidden rounded-[2rem] bg-ink-900 p-6 text-cream-50 sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-8 sm:flex-row sm:items-end">
          <AvatarUpload familyId={id} personId={pid} src={fileUrl(person.avatarId)} name={personShortName(person)} canEdit={editable} />
          <div className="min-w-0 flex-1">
            {linkedMembers.length > 0 && (
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gold-300">
                <UserRound className="h-3.5 w-3.5" /> Участник: {linkedMembers.map((m) => m.user.name).join(', ')}
              </p>
            )}
            <h2 className="font-serif text-4xl font-semibold leading-tight sm:text-5xl">{personName(person)}</h2>
            {person.maidenName && <p className="mt-1 text-cream-100/60">урождённая {person.maidenName}</p>}
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {lifeYears(person) && <span className="chip bg-white/10 px-3 py-1.5">{person.isLiving ? `род. ${person.birthDate}` : `${person.birthDate ?? '?'} — ${person.deathDate ?? '?'}`}</span>}
              {person.birthPlace && <span className="chip bg-white/10 px-3 py-1.5"><MapPin className="h-3.5 w-3.5 text-gold-400" /> {person.birthPlace}</span>}
              {person.occupation && <span className="chip bg-white/10 px-3 py-1.5"><Briefcase className="h-3.5 w-3.5 text-gold-400" /> {person.occupation}</span>}
            </div>
            {person.livedPlaces && <p className="mt-3 text-sm text-cream-100/60">Жил(а): {person.livedPlaces}</p>}
          </div>
          {membership.personId !== pid && (
            <form action={linkSelfAction}>
              <input type="hidden" name="familyId" value={id} />
              <input type="hidden" name="personId" value={pid} />
              <button className="btn-ghost btn-sm text-cream-50">Это я</button>
            </form>
          )}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-8">
          <section className="card p-6 sm:p-8">
            <h3 className="font-serif text-2xl font-semibold">Биография</h3>
            {person.bio ? (
              <Paragraphs text={person.bio} className="mt-4 text-ink-700" />
            ) : (
              <p className="mt-3 text-ink-400">Пока ничего не записано. {editable && 'Расскажите, каким был этот человек, чем жил и что ценил.'}</p>
            )}
          </section>

          <section>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-serif text-2xl font-semibold">Материалы <span className="text-ink-300">{materials.length}</span></h3>
              {editable && (
                <MaterialUploader familyId={id} persons={personOpts} tasks={tasks.map((t) => ({ id: t.id, name: t.title }))} defaultPersonIds={[pid]} className="btn-gold btn-sm" />
              )}
            </div>
            {materials.length ? (
              <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3">
                {materials.map((m) => <MaterialCard key={m.id} m={m} familyId={id} />)}
              </div>
            ) : (
              <p className="mt-4 rounded-3xl border border-dashed border-ink-900/15 p-8 text-center text-ink-400">Фотографии, документы и воспоминания об этом человеке появятся здесь.</p>
            )}
          </section>

          {editable && (
            <details className="card group p-6 sm:p-8">
              <summary className="flex cursor-pointer list-none items-center justify-between font-serif text-2xl font-semibold">
                <span className="flex items-center gap-3"><Pencil className="h-5 w-5 text-gold-600" /> Редактировать карточку</span>
                <Plus className="h-5 w-5 transition group-open:rotate-45" />
              </summary>
              <div className="mt-6">
                <PersonForm familyId={id} values={person} />
              </div>
              <form action={deletePersonAction} className="mt-8 border-t border-ink-900/8 pt-6">
                <input type="hidden" name="id" value={pid} />
                <ConfirmButton message="Удалить карточку и все её связи? Материалы останутся в архиве." className="btn-sm btn text-rose-500 hover:bg-rose-500/10">
                  <Trash2 className="h-4 w-4" /> Удалить карточку
                </ConfirmButton>
              </form>
            </details>
          )}
        </div>

        <aside className="space-y-6">
          <section className="card p-5 sm:p-6">
            <h3 className="px-2 font-serif text-xl font-semibold">Семья</h3>
            <div className="mt-3 space-y-0.5">
              {parents.map(({ p, relId }) => <RelPerson key={relId} p={p} familyId={id} label={label.parent(p)} relId={relId} editable={editable} />)}
              {spouses.map(({ p, relId }) => <RelPerson key={relId} p={p} familyId={id} label={label.spouse(p)} relId={relId} editable={editable} />)}
              {siblings.map((p) => <RelPerson key={p.id} p={p} familyId={id} label={label.sibling(p)} editable={editable} />)}
              {children.map(({ p, relId }) => <RelPerson key={relId} p={p} familyId={id} label={label.child(p)} relId={relId} editable={editable} />)}
              {!parents.length && !spouses.length && !children.length && !siblings.length && <p className="px-2 text-sm text-ink-400">Связи ещё не указаны.</p>}
            </div>
            {editable && (
              <>
                <p className="mt-6 px-2 text-xs font-semibold uppercase tracking-wider text-ink-400">Добавить нового</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {[
                    { r: 'parent', l: g === 'UNKNOWN' ? 'Родителя' : 'Маму / папу', hide: parents.length >= 2 },
                    { r: 'spouse', l: 'Супруга(у)' },
                    { r: 'child', l: 'Ребёнка' },
                    { r: 'sibling', l: 'Брата / сестру', hide: parents.length === 0 },
                  ].filter((b) => !b.hide).map((b) => (
                    <Link key={b.r} href={`/app/family/${id}/person/new?relativeId=${pid}&relation=${b.r}`} className="rounded-xl border border-ink-900/10 px-3 py-2.5 text-center text-sm font-medium transition hover:border-gold-500 hover:bg-gold-500/10">
                      + {b.l}
                    </Link>
                  ))}
                </div>
                <p className="mt-6 px-2 text-xs font-semibold uppercase tracking-wider text-ink-400">Связать с уже добавленным</p>
                <div className="mt-2 px-2"><AddRelationForm personId={pid} options={options} /></div>
              </>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

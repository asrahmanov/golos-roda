import Link from 'next/link';
import { GitFork, UserPlus, Users } from 'lucide-react';
import { db } from '@/lib/db';
import { canEdit, requireFamily } from '@/lib/family';
import { fileUrl } from '@/lib/storage';
import { FamilyTree } from '@/components/app/FamilyTree';

export default async function FamilyTreePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ joined?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { role, membership } = await requireFamily(id);
  const [persons, relations] = await Promise.all([
    db.person.findMany({
      where: { familyId: id },
      include: { _count: { select: { materials: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    db.relation.findMany({ where: { familyId: id }, select: { type: true, fromId: true, toId: true } }),
  ]);
  const editable = canEdit(role);

  if (persons.length === 0) {
    return (
      <div className="grid min-h-[60vh] place-items-center rounded-[1.75rem] bg-cream-100 p-8 text-center">
        <div className="max-w-md">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-ink-900 text-gold-400">
            <GitFork className="h-9 w-9" />
          </span>
          <h2 className="mt-6 font-serif text-3xl font-semibold">Дерево пока пустое</h2>
          <p className="mt-3 text-ink-600">Начните с себя или со старшего родственника, о котором знаете больше всего.</p>
          {editable && (
            <Link href={`/app/family/${id}/person/new?me=1`} className="btn-gold mt-8">
              <UserPlus className="h-4 w-4" /> Добавить первого человека
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sp.joined && (
        <div className="flex items-center gap-3 rounded-2xl bg-sage-500/12 px-5 py-3 text-sm text-sage-500">
          <Users className="h-4 w-4" /> Вы присоединились к семейному пространству. Добро пожаловать!
        </div>
      )}
      {!membership.personId && (
        <div className="flex flex-col gap-3 rounded-2xl bg-gold-500/10 px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span>Отметьте себя в дереве — так родственникам будет проще ориентироваться.</span>
          <Link href={`/app/family/${id}/people?pick=me`} className="font-semibold text-gold-700 hover:underline">
            Это я →
          </Link>
        </div>
      )}
      <div className="h-[calc(100svh-15rem)] min-h-[480px]">
        <FamilyTree
          familyId={id}
          meId={membership.personId}
          canEdit={editable}
          relations={relations}
          persons={persons.map((p) => ({
            id: p.id,
            firstName: p.firstName,
            lastName: p.lastName,
            middleName: p.middleName,
            gender: p.gender,
            birthDate: p.birthDate,
            deathDate: p.deathDate,
            isLiving: p.isLiving,
            occupation: p.occupation,
            avatar: fileUrl(p.avatarId, true),
            materials: p._count.materials,
          }))}
        />
      </div>
      {editable && (
        <div className="flex justify-end">
          <Link href={`/app/family/${id}/person/new`} className="btn-dark btn-sm">
            <UserPlus className="h-4 w-4" /> Добавить человека
          </Link>
        </div>
      )}
    </div>
  );
}

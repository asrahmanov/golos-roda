import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/db';
import { personShortName, requireFamily } from '@/lib/family';
import { PersonForm } from '@/components/app/PersonForm';

const TITLES: Record<string, string> = {
  parent: 'Добавить родителя',
  child: 'Добавить ребёнка',
  spouse: 'Добавить супруга(у)',
  sibling: 'Добавить брата или сестру',
};

export default async function NewPersonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ relativeId?: string; relation?: string; me?: string; gender?: string; back?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const { membership } = await requireFamily(id, 'edit');
  const relative = sp.relativeId ? await db.person.findFirst({ where: { id: sp.relativeId, familyId: id } }) : null;
  const relation = relative && sp.relation && TITLES[sp.relation] ? sp.relation : undefined;
  const gender = sp.gender === 'MALE' || sp.gender === 'FEMALE' ? sp.gender : undefined;
  const back = sp.back === 'tree' ? 'tree' : undefined;

  let coParents: { id: string; name: string }[] = [];
  let linkSpouse: string | undefined;
  let lastName: string | null = null;
  if (relative && relation === 'child') {
    const sp2 = await db.relation.findMany({
      where: { type: 'SPOUSE', OR: [{ fromId: relative.id }, { toId: relative.id }] },
      include: { from: true, to: true },
    });
    coParents = sp2.map((r) => (r.fromId === relative.id ? r.to : r.from)).map((p) => ({ id: p.id, name: personShortName(p) }));
    lastName = relative.gender === 'MALE' ? relative.lastName : null;
  }
  if (relative && relation === 'parent') {
    const existing = await db.relation.findMany({ where: { type: 'PARENT', toId: relative.id }, include: { from: true } });
    if (existing.length === 1) linkSpouse = personShortName(existing[0].from);
  }
  if (relative && relation === 'sibling') lastName = relative.lastName;

  let title = relation ? TITLES[relation] : 'Новый человек в дереве';
  if (relation === 'spouse' && relative?.gender === 'MALE') title = 'Добавить супругу';
  if (relation === 'spouse' && relative?.gender === 'FEMALE') title = 'Добавить супруга';
  if (relation === 'parent' && gender) title = gender === 'MALE' ? 'Добавить отца' : 'Добавить мать';

  const backHref = back === 'tree' ? `/app/family/${id}${relative ? `?focus=${relative.id}` : ''}` : relative ? `/app/family/${id}/person/${relative.id}` : `/app/family/${id}`;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-semibold text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" /> {back === 'tree' ? 'К дереву' : 'Назад'}
      </Link>
      <h2 className="h-display mt-5 text-3xl sm:text-4xl">{title}</h2>
      {relative && <p className="mt-2 text-ink-500">для {personShortName(relative)}</p>}
      <div className="card mt-8 p-6 sm:p-10">
        <PersonForm
          familyId={id}
          relativeId={relative?.id}
          relation={relation}
          coParents={coParents}
          showLinkSpouse={linkSpouse}
          showIsMe={!membership.personId}
          defaultIsMe={sp.me === '1'}
          back={back}
          values={{ lastName, gender }}
        />
      </div>
    </div>
  );
}

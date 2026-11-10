'use client';

import { useActionState, useState } from 'react';
import { createPersonAction, updatePersonAction } from '@/actions/family';
import { Field, FormMessage, SubmitButton } from '@/components/ui/Form';
import { cn } from '@/lib/utils';

export type PersonValues = {
  id?: string;
  firstName?: string;
  lastName?: string | null;
  middleName?: string | null;
  maidenName?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'UNKNOWN';
  birthDate?: string | null;
  deathDate?: string | null;
  isLiving?: boolean;
  birthPlace?: string | null;
  livedPlaces?: string | null;
  occupation?: string | null;
  bio?: string | null;
};

export function PersonForm({
  familyId,
  values = {},
  relativeId,
  relation,
  coParents = [],
  showLinkSpouse,
  showIsMe,
  defaultIsMe,
}: {
  familyId: string;
  values?: PersonValues;
  relativeId?: string;
  relation?: string;
  coParents?: { id: string; name: string }[];
  showLinkSpouse?: string;
  showIsMe?: boolean;
  defaultIsMe?: boolean;
}) {
  const editing = !!values.id;
  const [state, action] = useActionState(editing ? updatePersonAction : createPersonAction, undefined);
  const [living, setLiving] = useState(values.isLiving ?? true);
  const [gender, setGender] = useState(values.gender ?? 'UNKNOWN');

  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="familyId" value={familyId} />
      {values.id && <input type="hidden" name="id" value={values.id} />}
      {relativeId && <input type="hidden" name="relativeId" value={relativeId} />}
      {relation && <input type="hidden" name="relation" value={relation} />}

      <div className="flex flex-wrap gap-2">
        {[
          { v: 'FEMALE', l: 'Женщина' },
          { v: 'MALE', l: 'Мужчина' },
          { v: 'UNKNOWN', l: 'Не указано' },
        ].map((g) => (
          <label key={g.v} className="cursor-pointer">
            <input type="radio" name="gender" value={g.v} checked={gender === g.v} onChange={() => setGender(g.v as typeof gender)} className="peer sr-only" />
            <span className="chip border border-ink-900/12 px-4 py-2 text-sm text-ink-600 transition peer-checked:border-ink-900 peer-checked:bg-ink-900 peer-checked:text-cream-50">
              {g.l}
            </span>
          </label>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Имя *">
          <input name="firstName" required defaultValue={values.firstName} className="input" autoFocus={!editing} />
        </Field>
        <Field label="Отчество">
          <input name="middleName" defaultValue={values.middleName ?? ''} className="input" />
        </Field>
        <Field label="Фамилия">
          <input name="lastName" defaultValue={values.lastName ?? ''} className="input" />
        </Field>
      </div>
      {gender !== 'MALE' && (
        <Field label="Девичья фамилия">
          <input name="maidenName" defaultValue={values.maidenName ?? ''} className="input" />
        </Field>
      )}

      <label className="flex w-fit cursor-pointer items-center gap-3">
        <input type="checkbox" name="isLiving" checked={living} onChange={(e) => setLiving(e.target.checked)} className="peer sr-only" />
        <span className="relative h-6 w-11 rounded-full bg-ink-900/15 transition peer-checked:bg-sage-500 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
        <span className="text-sm font-semibold">{living ? 'Жив(а)' : 'Ушёл(ушла) из жизни'}</span>
      </label>

      <div className={cn('grid gap-4', living ? 'sm:grid-cols-2' : 'sm:grid-cols-3')}>
        <Field label="Дата рождения" hint="Можно только год или «около 1930»">
          <input name="birthDate" defaultValue={values.birthDate ?? ''} className="input" placeholder="12.03.1932" />
        </Field>
        {!living && (
          <Field label="Дата смерти">
            <input name="deathDate" defaultValue={values.deathDate ?? ''} className="input" />
          </Field>
        )}
        <Field label="Место рождения">
          <input name="birthPlace" defaultValue={values.birthPlace ?? ''} className="input" placeholder="Город, село, регион" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Где жил(а)">
          <input name="livedPlaces" defaultValue={values.livedPlaces ?? ''} className="input" placeholder="Например: Тула, Москва" />
        </Field>
        <Field label="Профессия, занятие">
          <input name="occupation" defaultValue={values.occupation ?? ''} className="input" />
        </Field>
      </div>
      <Field label="Биография" hint="О чём мечтал(а), чем гордился(ась), что хотел(а) передать семье">
        <textarea name="bio" rows={6} defaultValue={values.bio ?? ''} className="input" />
      </Field>

      {coParents.length > 0 && (
        <Field label="Второй родитель">
          <select name="coParentId" className="input" defaultValue={coParents.length === 1 ? coParents[0].id : ''}>
            <option value="">— не указывать —</option>
            {coParents.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
      )}
      {showLinkSpouse && (
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="linkSpouse" defaultChecked className="h-4 w-4 accent-gold-600" />
          Отметить как супруга(у): {showLinkSpouse}
        </label>
      )}
      {showIsMe && (
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="isMe" defaultChecked={defaultIsMe} className="h-4 w-4 accent-gold-600" />
          Это я
        </label>
      )}

      <FormMessage state={state} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <SubmitButton className="btn-gold px-8">{editing ? 'Сохранить карточку' : 'Добавить в дерево'}</SubmitButton>
      </div>
    </form>
  );
}

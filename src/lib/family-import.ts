import 'server-only';
import crypto from 'node:crypto';
import type { Gender, MaterialType, Visibility } from '@prisma/client';
import { db } from './db';
import { logActivity } from './family';
import { deleteFamilyFiles, fileKind, mimeFromName, saveBuffer } from './storage';

export const IMPORT_FORMAT = 'golos-roda/family@1';
const MAX_PERSONS = 2000;

type NormPerson = {
  key: string;
  firstName: string;
  lastName: string | null;
  middleName: string | null;
  maidenName: string | null;
  gender: Gender;
  birthDate: string | null;
  deathDate: string | null;
  isLiving: boolean;
  birthPlace: string | null;
  livedPlaces: string | null;
  occupation: string | null;
  bio: string | null;
  avatar: string | null;
};
type NormRelation = { type: 'PARENT' | 'SPOUSE' | 'SIBLING'; from: string; to: string };
type NormMaterial = {
  type: MaterialType;
  title: string;
  body: string | null;
  dateText: string | null;
  place: string | null;
  externalUrl: string | null;
  visibility: Visibility;
  personKeys: string[];
  file: string | null;
};
export type ImportData = {
  name: string | null;
  description: string | null;
  persons: NormPerson[];
  relations: NormRelation[];
  materials: NormMaterial[];
  warnings: string[];
};
export type ImportResult = { familyId: string; persons: number; relations: number; materials: number; files: number; warnings: string[] };

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
const pick = (o: Obj, keys: string[]) => {
  for (const k of keys) if (o[k] !== undefined && o[k] !== null && o[k] !== '') return o[k];
  return undefined;
};
const text = (v: unknown, max: number) => {
  if (v === undefined || v === null) return null;
  const s = (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '').trim();
  return s ? s.slice(0, max) : null;
};
const idOf = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? String(v).trim() : '');

function gender(v: unknown): Gender {
  const g = String(v ?? '').trim().toLowerCase();
  if (['male', 'm', 'man', 'мужской', 'муж', 'м', 'мужчина'].includes(g)) return 'MALE';
  if (['female', 'f', 'woman', 'женский', 'жен', 'ж', 'женщина'].includes(g)) return 'FEMALE';
  return 'UNKNOWN';
}

const PATRONYMIC = /(вич|вна|чна|ична|ьич|оглы|кызы)$/i;
/** «Иван Иванович Иванов», «Иванов Иван Иванович», «Иван Иванов» */
function splitName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { firstName: parts[0], lastName: null, middleName: null };
  if (parts.length === 2) return { firstName: parts[0], lastName: parts[1], middleName: null };
  const pIdx = parts.findIndex((p) => PATRONYMIC.test(p));
  if (pIdx === 2) return { lastName: parts[0], firstName: parts[1], middleName: parts.slice(2).join(' ') };
  if (pIdx === 1) return { firstName: parts[0], middleName: parts[1], lastName: parts.slice(2).join(' ') };
  return { firstName: parts[0], middleName: null, lastName: parts.slice(1).join(' ') };
}

function relType(v: unknown): NormRelation['type'] | null {
  const t = String(v ?? '').trim().toLowerCase();
  if (['parent', 'родитель', 'parent-child', 'parent_of'].includes(t)) return 'PARENT';
  if (['spouse', 'marriage', 'married', 'супруги', 'брак', 'супруг', 'супруга', 'partner'].includes(t)) return 'SPOUSE';
  if (['sibling', 'siblings', 'брат', 'сестра', 'брат/сестра'].includes(t)) return 'SIBLING';
  return null;
}

const MATERIAL_TYPES: MaterialType[] = ['PHOTO', 'DOCUMENT', 'MEMORY', 'AUDIO', 'VIDEO', 'LINK'];
const VIS: Visibility[] = ['FAMILY', 'EDITORS', 'PRIVATE'];

/** Приводит выгрузку сайта или «скелет» дерева (в т.ч. сгенерированный ИИ) к единому виду. Бросает ошибку, если загрузить нечего. */
export function normalizeImport(raw: unknown): ImportData {
  if (Array.isArray(raw)) raw = { persons: raw };
  if (!isObj(raw)) throw new Error('Файл не похож на дерево: ожидается объект с массивом persons');
  const root = isObj(raw.family) && Array.isArray((raw.family as Obj).persons) ? (raw.family as Obj) : raw;
  const fam = isObj(raw.family) ? (raw.family as Obj) : {};
  const warnings: string[] = [];
  const rawPersons = pick(root, ['persons', 'people', 'members', 'люди']);
  if (!Array.isArray(rawPersons) || !rawPersons.length) throw new Error('В файле нет списка людей (поле persons)');
  if (rawPersons.length > MAX_PERSONS) throw new Error(`Слишком много людей: ${rawPersons.length}. Максимум ${MAX_PERSONS}`);

  const persons: NormPerson[] = [];
  const keys = new Set<string>();
  const inline: { key: string; o: Obj }[] = [];
  rawPersons.forEach((rp, i) => {
    if (!isObj(rp)) return void warnings.push(`Запись №${i + 1} в persons пропущена: это не объект`);
    let key = idOf(pick(rp, ['id', 'key', 'uid']));
    if (!key || keys.has(key)) {
      if (key) warnings.push(`Повторяющийся id «${key}» — запись №${i + 1} получила новый`);
      key = `#${i + 1}`;
    }
    let firstName = text(pick(rp, ['firstName', 'first_name', 'givenName', 'имя']), 80);
    let lastName = text(pick(rp, ['lastName', 'last_name', 'surname', 'familyName', 'фамилия']), 80);
    let middleName = text(pick(rp, ['middleName', 'middle_name', 'patronymic', 'отчество']), 80);
    const full = text(pick(rp, ['name', 'fullName', 'full_name', 'фио']), 240);
    if (!firstName && full) {
      const s = splitName(full);
      firstName = s.firstName.slice(0, 80);
      lastName = lastName ?? s.lastName?.slice(0, 80) ?? null;
      middleName = middleName ?? s.middleName?.slice(0, 80) ?? null;
    }
    if (!firstName) {
      firstName = '?';
      warnings.push(`У записи №${i + 1} нет имени — поставлен «?»`);
    }
    const deathDate = text(pick(rp, ['deathDate', 'death', 'died', 'deathYear', 'death_date']), 40);
    const living = pick(rp, ['isLiving', 'living', 'alive']);
    keys.add(key);
    persons.push({
      key,
      firstName,
      lastName,
      middleName,
      maidenName: text(pick(rp, ['maidenName', 'maiden_name']), 80),
      gender: gender(pick(rp, ['gender', 'sex', 'пол'])),
      birthDate: text(pick(rp, ['birthDate', 'birth', 'born', 'birthYear', 'birth_date']), 40),
      deathDate,
      isLiving: typeof living === 'boolean' ? living : !deathDate,
      birthPlace: text(pick(rp, ['birthPlace', 'birth_place', 'place']), 200),
      livedPlaces: text(pick(rp, ['livedPlaces', 'lived_places']), 500),
      occupation: text(pick(rp, ['occupation', 'profession', 'job']), 200),
      bio: text(pick(rp, ['bio', 'biography', 'notes', 'description']), 20000),
      avatar: text(rp.avatar, 300),
    });
    inline.push({ key, o: rp });
  });

  const candidates: NormRelation[] = [];
  const rawRels = pick(root, ['relations', 'relationships', 'links', 'edges', 'связи']);
  if (rawRels !== undefined && !Array.isArray(rawRels)) warnings.push('Поле relations должно быть массивом — связи пропущены');
  (Array.isArray(rawRels) ? rawRels : []).forEach((rr, i) => {
    if (!isObj(rr)) return;
    if (rr.parent !== undefined && rr.child !== undefined) {
      candidates.push({ type: 'PARENT', from: idOf(rr.parent), to: idOf(rr.child) });
      return;
    }
    const type = relType(rr.type);
    const from = idOf(pick(rr, ['from', 'fromId', 'source', 'a', 'person1']));
    const to = idOf(pick(rr, ['to', 'toId', 'target', 'b', 'person2']));
    if (!type) return void warnings.push(`Связь №${i + 1}: неизвестный тип «${String(rr.type ?? '')}» — пропущена (нужно PARENT, SPOUSE или SIBLING)`);
    candidates.push({ type, from, to });
  });
  for (const { key, o } of inline) {
    const list = (v: unknown) => (Array.isArray(v) ? v.map(idOf) : v !== undefined && v !== null && v !== '' ? [idOf(v)] : []);
    for (const p of list(pick(o, ['parents', 'parentIds']))) candidates.push({ type: 'PARENT', from: p, to: key });
    for (const c of list(pick(o, ['children', 'childIds']))) candidates.push({ type: 'PARENT', from: key, to: c });
    for (const s of list(pick(o, ['spouses', 'spouseIds', 'spouse']))) candidates.push({ type: 'SPOUSE', from: key, to: s });
    for (const s of list(pick(o, ['siblings', 'siblingIds']))) candidates.push({ type: 'SIBLING', from: key, to: s });
  }

  // Проверка связей: существующие люди, без дублей, не больше двух родителей, без циклов
  const parentsOf = new Map<string, string[]>();
  const childrenOf = new Map<string, string[]>();
  const isAncestor = (a: string, of: string) => {
    const stack = [of];
    const seen = new Set<string>();
    while (stack.length) {
      const cur = stack.pop()!;
      for (const p of parentsOf.get(cur) ?? []) {
        if (p === a) return true;
        if (!seen.has(p)) { seen.add(p); stack.push(p); }
      }
    }
    return false;
  };
  const addParent = (parent: string, child: string) => {
    const ps = parentsOf.get(child) ?? [];
    if (ps.includes(parent)) return 'dup';
    if (ps.length >= 2) return 'many';
    if (parent === child || isAncestor(child, parent)) return 'cycle';
    parentsOf.set(child, [...ps, parent]);
    childrenOf.set(parent, [...(childrenOf.get(parent) ?? []), child]);
    return 'ok';
  };
  const relations: NormRelation[] = [];
  const pairSeen = new Set<string>();
  const sibPairs: [string, string][] = [];
  let missing = 0;
  for (const r of candidates) {
    if (!keys.has(r.from) || !keys.has(r.to)) { missing++; continue; }
    if (r.from === r.to) continue;
    if (r.type === 'PARENT') {
      const res = addParent(r.from, r.to);
      if (res === 'ok') relations.push(r);
      else if (res === 'many') warnings.push(`У «${nameOf(persons, r.to)}» больше двух родителей — лишняя связь пропущена`);
      else if (res === 'cycle') warnings.push(`Связь «${nameOf(persons, r.from)} — родитель ${nameOf(persons, r.to)}» создаёт цикл и пропущена`);
      continue;
    }
    const k = `${r.type}|${[r.from, r.to].sort().join('|')}`;
    if (pairSeen.has(k)) continue;
    pairSeen.add(k);
    if (r.type === 'SPOUSE') relations.push(r);
    else sibPairs.push([r.from, r.to]);
  }
  if (missing) warnings.push(`${missing} связ(ей) ссылаются на несуществующие id и пропущены`);
  // Брат/сестра: если родители известны у одного — переносим их второму; если у обоих неизвестны — прямая связь
  for (const [a, b] of sibPairs) {
    const pa = parentsOf.get(a) ?? [];
    const pb = parentsOf.get(b) ?? [];
    if (!pa.length && !pb.length) relations.push({ type: 'SIBLING', from: a, to: b });
    else if (!pa.length || !pb.length) {
      const [known, target] = pa.length ? [pa, b] : [pb, a];
      for (const p of known) if (addParent(p, target) === 'ok') relations.push({ type: 'PARENT', from: p, to: target });
    }
  }

  const byName = new Map<string, string[]>();
  for (const p of persons) {
    for (const n of new Set([fullName(p), shortName(p)])) byName.set(n, [...(byName.get(n) ?? []), p.key]);
  }
  const materials: NormMaterial[] = [];
  const rawMats = pick(root, ['materials']);
  (Array.isArray(rawMats) ? rawMats : []).forEach((rm) => {
    if (!isObj(rm)) return;
    const type = MATERIAL_TYPES.includes(rm.type as MaterialType) ? (rm.type as MaterialType) : 'MEMORY';
    let personKeys: string[] = [];
    if (Array.isArray(rm.personIds)) personKeys = rm.personIds.map(idOf).filter((k) => keys.has(k));
    else if (Array.isArray(rm.persons)) {
      for (const n of rm.persons) {
        const hit = byName.get(String(n ?? '').trim());
        if (hit?.length === 1) personKeys.push(hit[0]);
      }
    }
    let body = text(rm.body, 50000);
    if (Array.isArray(rm.comments) && rm.comments.length) {
      const lines = rm.comments.filter(isObj).map((c) => `— ${text(c.author, 120) ?? 'Участник'}: ${text(c.text, 4000) ?? ''}`);
      body = [body, `Комментарии из архива:\n${lines.join('\n')}`].filter(Boolean).join('\n\n').slice(0, 50000);
    }
    materials.push({
      type,
      title: text(rm.title, 200) ?? 'Без названия',
      body,
      dateText: text(rm.dateText, 60),
      place: text(rm.place, 200),
      externalUrl: text(rm.externalUrl, 1000),
      visibility: VIS.includes(rm.visibility as Visibility) ? (rm.visibility as Visibility) : 'FAMILY',
      personKeys: [...new Set(personKeys)],
      file: text(rm.file, 300),
    });
  });

  return {
    name: text(pick(fam, ['name']) ?? pick(raw, ['name', 'familyName']), 120),
    description: text(pick(fam, ['description']) ?? pick(raw, ['description']), 1000),
    persons,
    relations,
    materials,
    warnings,
  };
}

const fullName = (p: { firstName: string; lastName: string | null; middleName: string | null }) =>
  [p.lastName, p.firstName, p.middleName].filter(Boolean).join(' ');
const shortName = (p: { firstName: string; lastName: string | null; middleName: string | null }) =>
  [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ');
const nameOf = (persons: NormPerson[], key: string) => {
  const p = persons.find((x) => x.key === key);
  return p ? [p.firstName, p.lastName].filter(Boolean).join(' ') : key;
};

const newId = () => `c${crypto.randomBytes(12).toString('hex')}`;

/**
 * Записывает дерево в новую семью (target = 'new') или добавляет людей в существующую.
 * readFile — доступ к файлам из ZIP-архива (для фото профилей и материалов).
 */
export async function importFamily(opts: {
  userId: string;
  target: 'new' | { familyId: string };
  data: ImportData;
  fallbackName: string;
  readFile?: (path: string) => Promise<Buffer | null>;
  onProgress?: (done: number, total: number) => void;
}): Promise<ImportResult> {
  const { userId, data } = opts;
  const warnings = [...data.warnings];
  const isNew = opts.target === 'new';
  let familyId = isNew ? newId() : (opts.target as { familyId: string }).familyId;

  if (!isNew) {
    const total = await db.person.count({ where: { familyId } });
    if (total + data.persons.length > MAX_PERSONS) throw new Error(`В семье не может быть больше ${MAX_PERSONS} человек`);
  } else {
    const owned = await db.membership.count({ where: { userId, role: 'OWNER' } });
    if (owned >= 10) throw new Error('Можно создать не больше 10 семейных пространств');
  }

  const ids = new Map(data.persons.map((p) => [p.key, newId()]));
  await db.$transaction(async (tx) => {
    if (isNew) {
      const f = await tx.family.create({
        data: {
          id: familyId,
          name: data.name ?? opts.fallbackName,
          description: data.description,
          createdById: userId,
          members: { create: { userId, role: 'OWNER' } },
        },
      });
      familyId = f.id;
    }
    await tx.person.createMany({
      data: data.persons.map((p) => ({
        id: ids.get(p.key)!,
        familyId,
        firstName: p.firstName,
        lastName: p.lastName,
        middleName: p.middleName,
        maidenName: p.maidenName,
        gender: p.gender,
        birthDate: p.birthDate,
        deathDate: p.deathDate,
        isLiving: p.isLiving,
        birthPlace: p.birthPlace,
        livedPlaces: p.livedPlaces,
        occupation: p.occupation,
        bio: p.bio,
        createdById: userId,
      })),
    });
    await tx.relation.createMany({
      data: data.relations.map((r) => ({ familyId, type: r.type, fromId: ids.get(r.from)!, toId: ids.get(r.to)! })),
      skipDuplicates: true,
    });
  }, { timeout: 60_000 });

  let files = 0;
  let materials = 0;
  const steps = data.persons.filter((p) => p.avatar).length + data.materials.length;
  let step = 0;
  const tick = () => opts.onProgress?.(++step, steps);
  try {
    let budget = 5 * 1024 * 1024 * 1024 - ((await db.storedFile.aggregate({ where: { familyId }, _sum: { size: true } }))._sum.size ?? 0);
    const store = async (path: string, imageOnly: boolean) => {
      if (!opts.readFile) return null;
      const mime = mimeFromName(path);
      const kind = fileKind(mime);
      if (!kind || (imageOnly && kind !== 'image')) return null;
      const buf = await opts.readFile(path);
      if (!buf) return null;
      if (buf.length > budget) throw new Error('Достигнут лимит хранилища семьи (5 ГБ)');
      const f = await saveBuffer(buf, path.split('/').pop() || 'file', mime, { familyId, userId });
      budget -= f.size;
      files++;
      return f.id;
    };
    for (const p of data.persons) {
      if (!p.avatar) continue;
      tick();
      try {
        const fileId = await store(p.avatar, true);
        if (fileId) await db.person.update({ where: { id: ids.get(p.key)! }, data: { avatarId: fileId } });
      } catch (e) {
        warnings.push(`Фото «${nameOf(data.persons, p.key)}» не загружено: ${e instanceof Error ? e.message : 'ошибка'}`);
      }
    }
    for (const m of data.materials) {
      tick();
      let fileId: string | null = null;
      if (m.file) {
        try {
          fileId = await store(m.file, false);
        } catch (e) {
          warnings.push(`Файл материала «${m.title}» не загружен: ${e instanceof Error ? e.message : 'ошибка'}`);
        }
        if (!fileId && !m.body && !m.externalUrl) continue;
      }
      await db.material.create({
        data: {
          familyId,
          type: fileId ? m.type : m.externalUrl && m.type === 'LINK' ? 'LINK' : 'MEMORY',
          title: m.title,
          body: m.body,
          dateText: m.dateText,
          place: m.place,
          externalUrl: m.externalUrl,
          visibility: m.visibility,
          fileId,
          authorId: userId,
          persons: { create: m.personKeys.map((k) => ({ personId: ids.get(k)! })) },
        },
      });
      materials++;
    }
  } catch (e) {
    if (isNew) {
      await db.family.delete({ where: { id: familyId } }).catch(() => null);
      await deleteFamilyFiles(familyId);
      await db.storedFile.deleteMany({ where: { familyId } }).catch(() => null);
    }
    throw e;
  }

  await logActivity(
    familyId,
    userId,
    'family.import',
    `загрузил(а) архив: ${data.persons.length} чел., ${data.relations.length} связей${materials ? `, ${materials} материалов` : ''}`,
    `/app/family/${familyId}`,
  );
  return { familyId, persons: data.persons.length, relations: data.relations.length, materials, files, warnings };
}

'use server';

import crypto from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Gender, MemberRole, Visibility } from '@prisma/client';
import { db } from '@/lib/db';
import { requireUser, destroySession, verifyPassword } from '@/lib/auth';
import { logActivity, personShortName, requireFamily } from '@/lib/family';
import { completeTaskIfAny, validPersonIds } from '@/lib/family-ops';
import { deleteFamilyFiles, deleteStoredFile } from '@/lib/storage';
import { optStr, str } from '@/lib/utils';
import type { ActionState } from '@/components/ui/Form';

function fail(e: unknown): ActionState {
  return { error: e instanceof Error ? e.message : 'Что-то пошло не так' };
}

const GENDERS: Gender[] = ['MALE', 'FEMALE', 'UNKNOWN'];
const ROLES: MemberRole[] = ['OWNER', 'EDITOR', 'VIEWER'];
const VIS: Visibility[] = ['FAMILY', 'EDITORS', 'PRIVATE'];

/* ---------- Семья ---------- */

export async function createFamilyAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const name = str(fd.get('name'), 120);
  if (name.length < 2) return { error: 'Назовите семейное пространство, например «Семья Ивановых»' };
  const count = await db.membership.count({ where: { userId: user.id, role: 'OWNER' } });
  if (count >= 10) return { error: 'Можно создать не больше 10 семейных пространств' };
  const family = await db.family.create({
    data: {
      name,
      description: optStr(fd.get('description'), 1000),
      createdById: user.id,
      members: { create: { userId: user.id, role: 'OWNER' } },
    },
  });
  const firstName = str(fd.get('firstName'), 80);
  if (firstName) {
    const me = await db.person.create({
      data: {
        familyId: family.id,
        firstName,
        lastName: optStr(fd.get('lastName'), 80),
        birthDate: optStr(fd.get('birthDate'), 40),
        gender: GENDERS.includes(fd.get('gender') as Gender) ? (fd.get('gender') as Gender) : 'UNKNOWN',
        createdById: user.id,
      },
    });
    await db.membership.update({ where: { familyId_userId: { familyId: family.id, userId: user.id } }, data: { personId: me.id } });
  }
  await logActivity(family.id, user.id, 'family.create', `создал(а) семейное пространство «${name}»`);
  redirect(`/app/family/${family.id}`);
}

export async function updateFamilyAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const familyId = str(fd.get('familyId'));
    await requireFamily(familyId, 'owner');
    const name = str(fd.get('name'), 120);
    if (name.length < 2) return { error: 'Укажите название' };
    await db.family.update({ where: { id: familyId }, data: { name, description: optStr(fd.get('description'), 1000) } });
    revalidatePath(`/app/family/${familyId}`, 'layout');
    return { ok: true, message: 'Сохранено' };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteFamilyAction(fd: FormData) {
  const familyId = str(fd.get('familyId'));
  const { user, family } = await requireFamily(familyId, 'owner');
  if (str(fd.get('confirm')) !== family.name) throw new Error('Название введено неверно');
  await db.family.delete({ where: { id: familyId } });
  await deleteFamilyFiles(familyId);
  await db.storedFile.deleteMany({ where: { familyId } });
  void user;
  redirect('/app?deleted=1');
}

/* ---------- Приглашения и участники ---------- */

export async function createInviteAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const familyId = str(fd.get('familyId'));
    const { user } = await requireFamily(familyId, 'owner');
    const roleRaw = fd.get('role') as MemberRole;
    const role = roleRaw === 'EDITOR' ? 'EDITOR' : 'VIEWER';
    const days = Math.min(60, Math.max(1, Number(fd.get('days')) || 14));
    await db.invite.create({
      data: {
        familyId,
        role,
        note: optStr(fd.get('note'), 120),
        token: crypto.randomBytes(18).toString('base64url'),
        createdById: user.id,
        expiresAt: new Date(Date.now() + days * 86400000),
        maxUses: Math.min(50, Math.max(1, Number(fd.get('maxUses')) || 5)),
      },
    });
    revalidatePath(`/app/family/${familyId}/members`);
    return { ok: true, message: 'Ссылка-приглашение создана. Скопируйте её и отправьте родственникам.' };
  } catch (e) {
    return fail(e);
  }
}

export async function revokeInviteAction(fd: FormData) {
  const id = str(fd.get('id'));
  const inv = await db.invite.findUnique({ where: { id } });
  if (!inv) return;
  await requireFamily(inv.familyId, 'owner');
  await db.invite.update({ where: { id }, data: { revoked: true } });
  revalidatePath(`/app/family/${inv.familyId}/members`);
}

export async function acceptInviteAction(fd: FormData) {
  const user = await requireUser();
  const token = str(fd.get('token'));
  const inv = await db.invite.findUnique({ where: { token }, include: { family: true } });
  if (!inv || inv.revoked || inv.expiresAt < new Date() || inv.usedCount >= inv.maxUses) {
    redirect(`/invite/${token}?error=1`);
  }
  const existing = await db.membership.findUnique({ where: { familyId_userId: { familyId: inv.familyId, userId: user.id } } });
  if (!existing) {
    await db.$transaction([
      db.membership.create({ data: { familyId: inv.familyId, userId: user.id, role: inv.role } }),
      db.invite.update({ where: { id: inv.id }, data: { usedCount: { increment: 1 } } }),
    ]);
    await logActivity(inv.familyId, user.id, 'member.join', 'присоединился(ась) к семье по приглашению');
  }
  redirect(`/app/family/${inv.familyId}?joined=1`);
}

export async function changeMemberRoleAction(fd: FormData) {
  const id = str(fd.get('id'));
  const role = fd.get('role') as MemberRole;
  if (!ROLES.includes(role)) return;
  const m = await db.membership.findUnique({ where: { id } });
  if (!m) return;
  const { user } = await requireFamily(m.familyId, 'owner');
  if (m.userId === user.id && role !== 'OWNER') {
    const owners = await db.membership.count({ where: { familyId: m.familyId, role: 'OWNER' } });
    if (owners <= 1) throw new Error('В семье должен остаться хотя бы один хранитель');
  }
  await db.membership.update({ where: { id }, data: { role } });
  revalidatePath(`/app/family/${m.familyId}/members`);
}

export async function removeMemberAction(fd: FormData) {
  const id = str(fd.get('id'));
  const m = await db.membership.findUnique({ where: { id }, include: { user: true } });
  if (!m) return;
  const { user } = await requireFamily(m.familyId, 'owner');
  if (m.userId === user.id) throw new Error('Чтобы выйти из семьи, используйте «Покинуть пространство»');
  await db.membership.delete({ where: { id } });
  await logActivity(m.familyId, user.id, 'member.remove', `исключил(а) участника ${m.user.name}`);
  revalidatePath(`/app/family/${m.familyId}/members`);
}

export async function leaveFamilyAction(fd: FormData) {
  const familyId = str(fd.get('familyId'));
  const { user, membership } = await requireFamily(familyId);
  if (membership.role === 'OWNER') {
    const owners = await db.membership.count({ where: { familyId, role: 'OWNER' } });
    if (owners <= 1) throw new Error('Вы единственный хранитель. Назначьте другого хранителя или удалите пространство.');
  }
  await db.membership.delete({ where: { id: membership.id } });
  await logActivity(familyId, user.id, 'member.leave', 'покинул(а) семейное пространство');
  redirect('/app');
}

export async function linkSelfAction(fd: FormData) {
  const familyId = str(fd.get('familyId'));
  const personId = optStr(fd.get('personId'));
  const { membership } = await requireFamily(familyId);
  if (personId) {
    const p = await db.person.findFirst({ where: { id: personId, familyId } });
    if (!p) return;
  }
  await db.membership.update({ where: { id: membership.id }, data: { personId } });
  revalidatePath(`/app/family/${familyId}`, 'layout');
}

/* ---------- Родственники ---------- */

function personData(fd: FormData) {
  const gender = fd.get('gender') as Gender;
  return {
    firstName: str(fd.get('firstName'), 80),
    lastName: optStr(fd.get('lastName'), 80),
    middleName: optStr(fd.get('middleName'), 80),
    maidenName: optStr(fd.get('maidenName'), 80),
    gender: GENDERS.includes(gender) ? gender : ('UNKNOWN' as Gender),
    birthDate: optStr(fd.get('birthDate'), 40),
    deathDate: optStr(fd.get('deathDate'), 40),
    isLiving: fd.get('isLiving') === 'on',
    birthPlace: optStr(fd.get('birthPlace'), 200),
    livedPlaces: optStr(fd.get('livedPlaces'), 500),
    occupation: optStr(fd.get('occupation'), 200),
    bio: optStr(fd.get('bio'), 20000),
  };
}

export async function createPersonAction(_: ActionState, fd: FormData): Promise<ActionState> {
  let target = '';
  try {
    const familyId = str(fd.get('familyId'));
    const { user } = await requireFamily(familyId, 'edit');
    const data = personData(fd);
    if (!data.firstName) return { error: 'Укажите имя' };
    const total = await db.person.count({ where: { familyId } });
    if (total >= 2000) return { error: 'Достигнут предел числа родственников в пространстве' };

    const relativeId = optStr(fd.get('relativeId'));
    const relation = str(fd.get('relation'));
    let relative = null;
    if (relativeId) {
      relative = await db.person.findFirst({ where: { id: relativeId, familyId } });
      if (!relative) return { error: 'Родственник не найден' };
    }

    const person = await db.person.create({ data: { ...data, familyId, createdById: user.id } });

    if (relative) {
      if (relation === 'parent') {
        await db.relation.create({ data: { familyId, type: 'PARENT', fromId: person.id, toId: relative.id } });
        const otherParents = await db.relation.findMany({ where: { type: 'PARENT', toId: relative.id, NOT: { fromId: person.id } } });
        if (otherParents.length === 1 && fd.get('linkSpouse') === 'on') {
          await db.relation.create({ data: { familyId, type: 'SPOUSE', fromId: otherParents[0].fromId, toId: person.id } }).catch(() => null);
        }
      } else if (relation === 'child') {
        await db.relation.create({ data: { familyId, type: 'PARENT', fromId: relative.id, toId: person.id } });
        const coParentId = optStr(fd.get('coParentId'));
        if (coParentId) {
          const co = await db.person.findFirst({ where: { id: coParentId, familyId } });
          if (co) await db.relation.create({ data: { familyId, type: 'PARENT', fromId: co.id, toId: person.id } });
        }
      } else if (relation === 'spouse') {
        await db.relation.create({ data: { familyId, type: 'SPOUSE', fromId: relative.id, toId: person.id } });
      } else if (relation === 'sibling') {
        const parents = await db.relation.findMany({ where: { type: 'PARENT', toId: relative.id } });
        if (parents.length === 0) {
          await db.person.delete({ where: { id: person.id } });
          return { error: 'Чтобы добавить брата или сестру, сначала добавьте хотя бы одного родителя' };
        }
        await db.relation.createMany({
          data: parents.map((p) => ({ familyId, type: 'PARENT' as const, fromId: p.fromId, toId: person.id })),
          skipDuplicates: true,
        });
      }
    }

    if (fd.get('isMe') === 'on') {
      await db.membership.update({ where: { familyId_userId: { familyId, userId: user.id } }, data: { personId: person.id } });
    }

    await logActivity(familyId, user.id, 'person.create', `добавил(а) родственника: ${personShortName(person)}`, `/app/family/${familyId}/person/${person.id}`);
    target = fd.get('stay') === '1' ? '' : `/app/family/${familyId}/person/${person.id}`;
    revalidatePath(`/app/family/${familyId}`, 'layout');
    if (!target) return { ok: true, message: `${personShortName(person)} добавлен(а) в дерево` };
  } catch (e) {
    return fail(e);
  }
  redirect(target);
}

export async function updatePersonAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const id = str(fd.get('id'));
    const p = await db.person.findUnique({ where: { id } });
    if (!p) return { error: 'Не найдено' };
    const { user } = await requireFamily(p.familyId, 'edit');
    const data = personData(fd);
    if (!data.firstName) return { error: 'Укажите имя' };
    await db.person.update({ where: { id }, data });
    await logActivity(p.familyId, user.id, 'person.update', `обновил(а) карточку: ${personShortName(data)}`, `/app/family/${p.familyId}/person/${id}`);
    revalidatePath(`/app/family/${p.familyId}`, 'layout');
    return { ok: true, message: 'Карточка сохранена' };
  } catch (e) {
    return fail(e);
  }
}

export async function deletePersonAction(fd: FormData) {
  const id = str(fd.get('id'));
  const p = await db.person.findUnique({ where: { id } });
  if (!p) return;
  const { user } = await requireFamily(p.familyId, 'edit');
  await db.person.delete({ where: { id } });
  if (p.avatarId) await deleteStoredFile(p.avatarId);
  await logActivity(p.familyId, user.id, 'person.delete', `удалил(а) карточку: ${personShortName(p)}`);
  redirect(`/app/family/${p.familyId}`);
}

export async function addRelationAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const personId = str(fd.get('personId'));
    const otherId = str(fd.get('otherId'));
    const kind = str(fd.get('kind'));
    const p = await db.person.findUnique({ where: { id: personId } });
    const o = await db.person.findUnique({ where: { id: otherId } });
    if (!p || !o || p.familyId !== o.familyId || p.id === o.id) return { error: 'Выберите другого родственника' };
    await requireFamily(p.familyId, 'edit');
    const familyId = p.familyId;
    let data: { type: 'PARENT' | 'SPOUSE'; fromId: string; toId: string };
    if (kind === 'parent') data = { type: 'PARENT', fromId: o.id, toId: p.id };
    else if (kind === 'child') data = { type: 'PARENT', fromId: p.id, toId: o.id };
    else data = { type: 'SPOUSE', fromId: p.id, toId: o.id };

    if (data.type === 'PARENT') {
      if (await isAncestor(data.toId, data.fromId)) return { error: 'Такая связь создаст цикл в дереве' };
      const parents = await db.relation.count({ where: { type: 'PARENT', toId: data.toId } });
      if (parents >= 2) return { error: 'У человека уже указаны два родителя' };
    } else {
      const exists = await db.relation.findFirst({ where: { type: 'SPOUSE', fromId: o.id, toId: p.id } });
      if (exists) return { error: 'Связь уже есть' };
    }
    await db.relation.create({ data: { ...data, familyId } }).catch(() => {
      throw new Error('Такая связь уже существует');
    });
    revalidatePath(`/app/family/${familyId}`, 'layout');
    return { ok: true, message: 'Связь добавлена' };
  } catch (e) {
    return fail(e);
  }
}

async function isAncestor(personId: string, maybeDescendantOf: string) {
  // true, если personId является предком maybeDescendantOf
  const seen = new Set<string>();
  let frontier = [maybeDescendantOf];
  while (frontier.length) {
    const rels = await db.relation.findMany({ where: { type: 'PARENT', toId: { in: frontier } }, select: { fromId: true } });
    frontier = [];
    for (const r of rels) {
      if (r.fromId === personId) return true;
      if (!seen.has(r.fromId)) {
        seen.add(r.fromId);
        frontier.push(r.fromId);
      }
    }
  }
  return false;
}

export async function removeRelationAction(fd: FormData) {
  const id = str(fd.get('id'));
  const r = await db.relation.findUnique({ where: { id } });
  if (!r) return;
  await requireFamily(r.familyId, 'edit');
  await db.relation.delete({ where: { id } });
  revalidatePath(`/app/family/${r.familyId}`, 'layout');
}

/* ---------- Материалы ---------- */

export async function createTextMaterialAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const familyId = str(fd.get('familyId'));
    const { user } = await requireFamily(familyId, 'edit');
    const type = str(fd.get('type')) === 'LINK' ? 'LINK' : 'MEMORY';
    const title = str(fd.get('title'), 200);
    const body = optStr(fd.get('body'), 50000);
    const externalUrl = optStr(fd.get('externalUrl'), 1000);
    if (!title) return { error: 'Добавьте заголовок' };
    if (type === 'MEMORY' && !body) return { error: 'Напишите текст воспоминания' };
    if (type === 'LINK' && (!externalUrl || !/^https?:\/\//i.test(externalUrl))) return { error: 'Укажите ссылку, начинающуюся с https://' };
    const personIds = await validPersonIds(familyId, fd.getAll('personIds').map(String));
    const vis = fd.get('visibility') as Visibility;
    const material = await db.material.create({
      data: {
        familyId,
        type,
        title,
        body,
        externalUrl,
        dateText: optStr(fd.get('dateText'), 60),
        place: optStr(fd.get('place'), 200),
        visibility: VIS.includes(vis) ? vis : 'FAMILY',
        authorId: user.id,
        persons: { create: personIds.map((personId) => ({ personId })) },
      },
    });
    await completeTaskIfAny(fd, familyId, user.id, material.id);
    await logActivity(familyId, user.id, 'material.create', `${type === 'MEMORY' ? 'записал(а) воспоминание' : 'добавил(а) ссылку'} «${title}»`, `/app/family/${familyId}/archive/${material.id}`);
    revalidatePath(`/app/family/${familyId}`, 'layout');
    return { ok: true, message: 'Сохранено в семейном архиве' };
  } catch (e) {
    return fail(e);
  }
}

export async function updateMaterialAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const id = str(fd.get('id'));
    const m = await db.material.findUnique({ where: { id } });
    if (!m) return { error: 'Не найдено' };
    const { user, role } = await requireFamily(m.familyId, 'edit');
    if (m.visibility === 'PRIVATE' && m.authorId !== user.id) return { error: 'Нет доступа' };
    const title = str(fd.get('title'), 200);
    if (!title) return { error: 'Добавьте заголовок' };
    const vis = fd.get('visibility') as Visibility;
    const personIds = await validPersonIds(m.familyId, fd.getAll('personIds').map(String));
    await db.$transaction([
      db.material.update({
        where: { id },
        data: {
          title,
          body: optStr(fd.get('body'), 50000),
          dateText: optStr(fd.get('dateText'), 60),
          place: optStr(fd.get('place'), 200),
          visibility: VIS.includes(vis) && (m.authorId === user.id || role === 'OWNER') ? vis : m.visibility,
        },
      }),
      db.materialPerson.deleteMany({ where: { materialId: id } }),
      db.materialPerson.createMany({ data: personIds.map((personId) => ({ materialId: id, personId })) }),
    ]);
    revalidatePath(`/app/family/${m.familyId}`, 'layout');
    return { ok: true, message: 'Изменения сохранены' };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteMaterialAction(fd: FormData) {
  const id = str(fd.get('id'));
  const m = await db.material.findUnique({ where: { id } });
  if (!m) return;
  const { user, role } = await requireFamily(m.familyId, 'edit');
  if (m.authorId !== user.id && role !== 'OWNER') throw new Error('Удалить материал может автор или хранитель');
  await db.material.delete({ where: { id } });
  if (m.fileId) {
    const stillUsed = await db.publicStory.count({ where: { imageId: m.fileId } });
    if (!stillUsed) await deleteStoredFile(m.fileId);
  }
  await logActivity(m.familyId, user.id, 'material.delete', `удалил(а) материал «${m.title}»`);
  redirect(`/app/family/${m.familyId}/archive`);
}

export async function addCommentAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const materialId = str(fd.get('materialId'));
    const text = str(fd.get('text'), 3000);
    if (!text) return { error: 'Напишите комментарий' };
    const m = await db.material.findUnique({ where: { id: materialId } });
    if (!m) return { error: 'Не найдено' };
    const { user } = await requireFamily(m.familyId);
    await db.comment.create({ data: { materialId, authorId: user.id, text } });
    await logActivity(m.familyId, user.id, 'comment.create', `прокомментировал(а) «${m.title}»`, `/app/family/${m.familyId}/archive/${m.id}`);
    revalidatePath(`/app/family/${m.familyId}/archive/${materialId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteCommentAction(fd: FormData) {
  const id = str(fd.get('id'));
  const c = await db.comment.findUnique({ where: { id }, include: { material: true } });
  if (!c) return;
  const { user, role } = await requireFamily(c.material.familyId);
  if (c.authorId !== user.id && role !== 'OWNER') return;
  await db.comment.delete({ where: { id } });
  revalidatePath(`/app/family/${c.material.familyId}/archive/${c.materialId}`);
}

/* ---------- Задания ---------- */

export async function completeTaskAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const familyId = str(fd.get('familyId'));
    const taskId = str(fd.get('taskId'));
    const { user } = await requireFamily(familyId, 'edit');
    const task = await db.task.findFirst({ where: { id: taskId, isPublished: true } });
    if (!task) return { error: 'Задание не найдено' };
    await db.taskCompletion.upsert({
      where: { taskId_familyId: { taskId, familyId } },
      create: { taskId, familyId, userId: user.id, note: optStr(fd.get('note'), 2000) },
      update: { note: optStr(fd.get('note'), 2000) },
    });
    await logActivity(familyId, user.id, 'task.complete', `отметил(а) задание «${task.title}» выполненным`, `/app/family/${familyId}/tasks`);
    revalidatePath(`/app/family/${familyId}`, 'layout');
    return { ok: true, message: 'Задание отмечено выполненным' };
  } catch (e) {
    return fail(e);
  }
}

/* ---------- Публичные истории ---------- */

export async function submitStoryAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const familyId = str(fd.get('familyId'));
    const { user } = await requireFamily(familyId, 'edit');
    if (fd.get('consent') !== 'on') return { error: 'Подтвердите согласие на публикацию' };
    const title = str(fd.get('title'), 200);
    const text = str(fd.get('text'), 20000);
    const authorName = str(fd.get('authorName'), 120) || user.name;
    if (!title || text.length < 30) return { error: 'Добавьте заголовок и текст истории (от 30 символов)' };
    const materialId = optStr(fd.get('materialId'));
    let imageId: string | null = null;
    if (materialId) {
      const m = await db.material.findFirst({ where: { id: materialId, familyId }, include: { file: true } });
      if (m?.file && m.file.mime.startsWith('image/')) imageId = m.file.id;
    }
    const pending = await db.publicStory.count({ where: { userId: user.id, status: 'PENDING' } });
    if (pending >= 5) return { error: 'У вас уже 5 историй на модерации. Дождитесь проверки.' };
    await db.publicStory.create({ data: { familyId, userId: user.id, materialId, imageId, title, text, authorName, consent: true } });
    revalidatePath(`/app/family/${familyId}/stories`);
    return { ok: true, message: 'История отправлена на модерацию. После проверки она появится в разделе «Истории».' };
  } catch (e) {
    return fail(e);
  }
}

export async function withdrawStoryAction(fd: FormData) {
  const user = await requireUser();
  const id = str(fd.get('id'));
  const st = await db.publicStory.findUnique({ where: { id } });
  if (!st || st.userId !== user.id) return;
  if (st.imageId) await db.storedFile.update({ where: { id: st.imageId }, data: { isPublic: false } }).catch(() => null);
  await db.publicStory.delete({ where: { id } });
  revalidatePath('/stories');
  if (st.familyId) revalidatePath(`/app/family/${st.familyId}/stories`);
}

/* ---------- Поддержка и аккаунт ---------- */

export async function createTicketAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const subject = str(fd.get('subject'), 200);
  const message = str(fd.get('message'), 5000);
  if (!subject || message.length < 5) return { error: 'Опишите вопрос' };
  const open = await db.supportTicket.count({ where: { userId: user.id, status: 'NEW' } });
  if (open >= 5) return { error: 'У вас уже 5 открытых обращений' };
  await db.supportTicket.create({ data: { userId: user.id, subject, message } });
  revalidatePath('/app/support');
  return { ok: true, message: 'Обращение отправлено. Ответ появится на этой странице.' };
}

export async function deleteAccountAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!(await verifyPassword(str(fd.get('password'), 200), user.passwordHash))) return { error: 'Неверный пароль' };
  const owned = await db.membership.findMany({ where: { userId: user.id, role: 'OWNER' }, select: { familyId: true } });
  for (const { familyId } of owned) {
    const others = await db.membership.findFirst({ where: { familyId, NOT: { userId: user.id } }, orderBy: [{ role: 'asc' }, { createdAt: 'asc' }] });
    const owners = await db.membership.count({ where: { familyId, role: 'OWNER' } });
    if (owners > 1) continue;
    if (others) {
      await db.membership.update({ where: { id: others.id }, data: { role: 'OWNER' } });
    } else {
      await db.family.delete({ where: { id: familyId } });
      await deleteFamilyFiles(familyId);
    }
  }
  await db.user.delete({ where: { id: user.id } });
  await destroySession();
  redirect('/?bye=1');
}
import 'server-only';
import { notFound } from 'next/navigation';
import type { MemberRole, Visibility } from '@prisma/client';
import { db } from './db';
import { requireUser } from './auth';

export const ROLE_LABEL: Record<MemberRole, string> = {
  OWNER: 'Хранитель',
  EDITOR: 'Соавтор',
  VIEWER: 'Читатель',
};

export const ROLE_HINT: Record<MemberRole, string> = {
  OWNER: 'Полный доступ: участники, приглашения, удаление пространства',
  EDITOR: 'Может добавлять родственников, материалы и воспоминания',
  VIEWER: 'Может смотреть дерево и материалы, оставлять комментарии',
};

export function canEdit(role: MemberRole) {
  return role === 'OWNER' || role === 'EDITOR';
}

export async function getMembership(familyId: string, userId: string) {
  return db.membership.findUnique({
    where: { familyId_userId: { familyId, userId } },
    include: { family: true },
  });
}

/** Доступ к семейному пространству. Администратор сайта доступа к семейным материалам не получает. */
export async function requireFamily(familyId: string, need: 'view' | 'edit' | 'owner' = 'view') {
  const user = await requireUser();
  const m = await getMembership(familyId, user.id);
  if (!m) notFound();
  if (need === 'edit' && !canEdit(m.role)) throw new Error('Недостаточно прав для изменения');
  if (need === 'owner' && m.role !== 'OWNER') throw new Error('Действие доступно только хранителю');
  return { user, membership: m, family: m.family, role: m.role };
}

export function visibilityFilter(role: MemberRole, userId: string) {
  const allowed: Visibility[] = canEdit(role) ? ['FAMILY', 'EDITORS'] : ['FAMILY'];
  return { OR: [{ visibility: { in: allowed } }, { authorId: userId }] };
}

export async function logActivity(familyId: string, userId: string | null, action: string, text: string, link?: string) {
  await db.activity.create({ data: { familyId, userId, action, text, link } });
}

export function personName(p: { firstName: string; lastName?: string | null; middleName?: string | null }) {
  return [p.lastName, p.firstName, p.middleName].filter(Boolean).join(' ');
}

export function personShortName(p: { firstName: string; lastName?: string | null }) {
  return [p.firstName, p.lastName].filter(Boolean).join(' ');
}

'use server';

import crypto from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { MaterialType, RegistrationStatus, RequestStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { hashPassword, requireAdmin } from '@/lib/auth';
import { DEFAULT_SETTINGS, LONG_TEXT_KEYS } from '@/lib/settings';
import { deleteStoredFile, saveUpload } from '@/lib/storage';
import { int, optStr, slugify, str } from '@/lib/utils';
import type { ActionState } from '@/components/ui/Form';

function fail(e: unknown): ActionState {
  return { error: e instanceof Error ? e.message : 'Ошибка' };
}

async function maybeImage(fd: FormData, field: string) {
  const f = fd.get(field);
  if (f instanceof File && f.size > 0) return saveUpload(f, { isPublic: true, imageOnly: true });
  return null;
}

/* ---------- Настройки ---------- */

export async function saveSettingsAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    const keys = Object.keys(DEFAULT_SETTINGS) as (keyof typeof DEFAULT_SETTINGS)[];
    for (const key of keys) {
      if (key === 'donationQrId') continue;
      if (key === 'showLiveStats' || key === 'registrationOpen') {
        if (fd.has('_bool')) {
          const value = fd.get(key) === 'on' ? 'true' : 'false';
          await db.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
        }
        continue;
      }
      if (!fd.has(key)) continue;
      const value = str(fd.get(key), LONG_TEXT_KEYS.includes(key) ? 100_000 : 2000);
      if (key === 'privacyText' || key === 'termsText') {
        const prev = await db.setting.findUnique({ where: { key } });
        if ((prev?.value ?? DEFAULT_SETTINGS[key]) === value) continue;
        const stamp = key === 'privacyText' ? 'privacyUpdated' : 'termsUpdated';
        const date = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Moscow' });
        await db.setting.upsert({ where: { key: stamp }, create: { key: stamp, value: date }, update: { value: date } });
      }
      await db.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
    }
    const qr = await maybeImage(fd, 'donationQr');
    if (qr) {
      const old = await db.setting.findUnique({ where: { key: 'donationQrId' } });
      await db.setting.upsert({ where: { key: 'donationQrId' }, create: { key: 'donationQrId', value: qr.id }, update: { value: qr.id } });
      if (old?.value) await deleteStoredFile(old.value);
    }
    if (fd.get('removeQr') === 'on') {
      const old = await db.setting.findUnique({ where: { key: 'donationQrId' } });
      if (old?.value) await deleteStoredFile(old.value);
      await db.setting.deleteMany({ where: { key: 'donationQrId' } });
    }
    revalidatePath('/', 'layout');
    return { ok: true, message: 'Настройки сохранены' };
  } catch (e) {
    return fail(e);
  }
}

/* ---------- Пользователи ---------- */

export async function toggleBlockUserAction(fd: FormData) {
  const admin = await requireAdmin();
  const id = str(fd.get('id'));
  if (id === admin.id) return;
  const u = await db.user.findUnique({ where: { id } });
  if (!u) return;
  await db.user.update({ where: { id }, data: { isBlocked: !u.isBlocked, sessionVer: { increment: 1 } } });
  revalidatePath('/admin/users');
}

export async function toggleAdminAction(fd: FormData) {
  const admin = await requireAdmin();
  const id = str(fd.get('id'));
  if (id === admin.id) return;
  const u = await db.user.findUnique({ where: { id } });
  if (!u) return;
  await db.user.update({ where: { id }, data: { role: u.role === 'ADMIN' ? 'USER' : 'ADMIN' } });
  revalidatePath('/admin/users');
}

export async function verifyUserEmailAction(fd: FormData) {
  await requireAdmin();
  await db.user.updateMany({ where: { id: str(fd.get('id')), emailVerifiedAt: null }, data: { emailVerifiedAt: new Date() } });
  revalidatePath('/admin/users');
}

export async function resetPasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(fd.get('id'));
  const password = crypto.randomBytes(6).toString('base64url');
  await db.user.update({ where: { id }, data: { passwordHash: await hashPassword(password), sessionVer: { increment: 1 } } });
  return { ok: true, message: `Новый временный пароль: ${password} — передайте его пользователю, он сможет сменить его в профиле.` };
}

export async function createUserAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const email = str(fd.get('email'), 200).toLowerCase();
  const name = str(fd.get('name'), 120);
  if (!email || !name) return { error: 'Укажите имя и почту' };
  if (await db.user.findUnique({ where: { email } })) return { error: 'Такой пользователь уже есть' };
  const password = crypto.randomBytes(6).toString('base64url');
  await db.user.create({ data: { email, name, emailVerifiedAt: new Date(), passwordHash: await hashPassword(password), role: fd.get('admin') === 'on' ? 'ADMIN' : 'USER' } });
  revalidatePath('/admin/users');
  return { ok: true, message: `Пользователь создан. Пароль: ${password}` };
}

/* ---------- Заявки на фестиваль ---------- */

const REG: RegistrationStatus[] = ['NEW', 'CONFIRMED', 'ATTENDED', 'CANCELLED'];
export async function updateRegistrationAction(fd: FormData) {
  await requireAdmin();
  const id = str(fd.get('id'));
  const status = fd.get('status') as RegistrationStatus;
  await db.festivalRegistration.update({
    where: { id },
    data: { ...(REG.includes(status) ? { status } : {}), ...(fd.has('adminNote') ? { adminNote: optStr(fd.get('adminNote'), 2000) } : {}) },
  });
  revalidatePath('/admin/registrations');
}

export async function deleteRegistrationAction(fd: FormData) {
  await requireAdmin();
  await db.festivalRegistration.delete({ where: { id: str(fd.get('id')) } }).catch(() => null);
  revalidatePath('/admin/registrations');
}

/* ---------- Заявки партнёров ---------- */

const RS: RequestStatus[] = ['NEW', 'IN_PROGRESS', 'DONE', 'ARCHIVED'];
export async function updateRequestAction(fd: FormData) {
  await requireAdmin();
  const id = str(fd.get('id'));
  const status = fd.get('status') as RequestStatus;
  await db.partnerRequest.update({
    where: { id },
    data: { ...(RS.includes(status) ? { status } : {}), ...(fd.has('adminNote') ? { adminNote: optStr(fd.get('adminNote'), 2000) } : {}) },
  });
  revalidatePath('/admin/requests');
}

export async function deleteRequestAction(fd: FormData) {
  await requireAdmin();
  await db.partnerRequest.delete({ where: { id: str(fd.get('id')) } }).catch(() => null);
  revalidatePath('/admin/requests');
}

/* ---------- Поддержка ---------- */

export async function replyTicketAction(fd: FormData) {
  await requireAdmin();
  const id = str(fd.get('id'));
  const status = fd.get('status') as RequestStatus;
  await db.supportTicket.update({
    where: { id },
    data: { reply: optStr(fd.get('reply'), 5000), status: RS.includes(status) ? status : 'DONE' },
  });
  revalidatePath('/admin/support');
}

/* ---------- Истории ---------- */

export async function moderateStoryAction(fd: FormData) {
  await requireAdmin();
  const id = str(fd.get('id'));
  const decision = str(fd.get('decision'));
  const st = await db.publicStory.findUnique({ where: { id } });
  if (!st) return;
  if (decision === 'delete') {
    if (st.imageId) await db.storedFile.update({ where: { id: st.imageId }, data: { isPublic: false } }).catch(() => null);
    await db.publicStory.delete({ where: { id } });
  } else {
    const approve = decision === 'approve';
    await db.publicStory.update({
      where: { id },
      data: {
        status: approve ? 'APPROVED' : 'REJECTED',
        publishedAt: approve ? new Date() : null,
        adminNote: optStr(fd.get('adminNote'), 1000),
        ...(fd.has('title') ? { title: str(fd.get('title'), 200) || st.title } : {}),
        ...(fd.has('text') ? { text: str(fd.get('text'), 20000) || st.text } : {}),
      },
    });
    if (st.imageId) await db.storedFile.update({ where: { id: st.imageId }, data: { isPublic: approve } }).catch(() => null);
  }
  revalidatePath('/admin/stories');
  revalidatePath('/stories');
  revalidatePath('/');
}

/* ---------- Задания ---------- */

const MT: MaterialType[] = ['PHOTO', 'DOCUMENT', 'MEMORY', 'AUDIO', 'VIDEO', 'LINK'];
export async function saveTaskAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    const id = optStr(fd.get('id'));
    const title = str(fd.get('title'), 200);
    const description = str(fd.get('description'), 4000);
    if (!title || !description) return { error: 'Заполните название и описание' };
    const hint = fd.get('hint') as MaterialType;
    const endsAt = optStr(fd.get('endsAt'));
    const data = {
      title,
      description,
      icon: str(fd.get('icon'), 30) || 'sparkles',
      hint: MT.includes(hint) ? hint : null,
      order: int(fd.get('order'), 0, -1000, 1000),
      isPublished: fd.get('isPublished') === 'on',
      endsAt: endsAt ? new Date(endsAt) : null,
    };
    if (id) await db.task.update({ where: { id }, data });
    else await db.task.create({ data });
    revalidatePath('/admin/tasks');
    revalidatePath('/');
    return { ok: true, message: id ? 'Задание обновлено' : 'Задание создано' };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteTaskAction(fd: FormData) {
  await requireAdmin();
  await db.task.delete({ where: { id: str(fd.get('id')) } }).catch(() => null);
  revalidatePath('/admin/tasks');
}

/* ---------- Новости ---------- */

export async function saveNewsAction(_: ActionState, fd: FormData): Promise<ActionState> {
  let id: string | null = null;
  try {
    await requireAdmin();
    id = optStr(fd.get('id'));
    const title = str(fd.get('title'), 250);
    const body = str(fd.get('body'), 100000);
    if (!title || !body) return { error: 'Заполните заголовок и текст' };
    let slug = slugify(str(fd.get('slug'), 100) || title) || `news-${Date.now()}`;
    const clash = await db.news.findFirst({ where: { slug, NOT: id ? { id } : undefined } });
    if (clash) slug = `${slug}-${Date.now().toString(36)}`;
    const cover = await maybeImage(fd, 'cover');
    const publishedAt = optStr(fd.get('publishedAt'));
    const data = {
      title,
      body,
      slug,
      excerpt: optStr(fd.get('excerpt'), 500),
      published: fd.get('published') === 'on',
      ...(publishedAt ? { publishedAt: new Date(publishedAt) } : {}),
      ...(cover ? { coverId: cover.id } : {}),
    };
    if (id) {
      const old = await db.news.findUnique({ where: { id } });
      await db.news.update({ where: { id }, data });
      if (cover && old?.coverId) await deleteStoredFile(old.coverId);
    } else {
      id = (await db.news.create({ data })).id;
    }
    revalidatePath('/news');
    revalidatePath('/');
  } catch (e) {
    return fail(e);
  }
  redirect(`/admin/news?saved=1`);
}

export async function deleteNewsAction(fd: FormData) {
  await requireAdmin();
  const n = await db.news.findUnique({ where: { id: str(fd.get('id')) } });
  if (!n) return;
  await db.news.delete({ where: { id: n.id } });
  if (n.coverId) await deleteStoredFile(n.coverId);
  revalidatePath('/admin/news');
  revalidatePath('/news');
}

/* ---------- FAQ, программа, партнёры ---------- */

export async function saveFaqAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = optStr(fd.get('id'));
  const question = str(fd.get('question'), 500);
  const answer = str(fd.get('answer'), 5000);
  if (!question || !answer) return { error: 'Заполните вопрос и ответ' };
  const data = { question, answer, order: int(fd.get('order'), 0, -1000, 1000), published: fd.get('published') === 'on' };
  if (id) await db.faqItem.update({ where: { id }, data });
  else await db.faqItem.create({ data });
  revalidatePath('/admin/content');
  revalidatePath('/');
  return { ok: true, message: 'Сохранено' };
}

export async function deleteFaqAction(fd: FormData) {
  await requireAdmin();
  await db.faqItem.delete({ where: { id: str(fd.get('id')) } }).catch(() => null);
  revalidatePath('/admin/content');
  revalidatePath('/');
}

export async function saveProgramAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = optStr(fd.get('id'));
  const time = str(fd.get('time'), 40);
  const title = str(fd.get('title'), 300);
  if (!time || !title) return { error: 'Укажите время и название' };
  const data = { time, title, description: optStr(fd.get('description'), 1000), zone: optStr(fd.get('zone'), 120), order: int(fd.get('order'), 0, -1000, 1000) };
  if (id) await db.programItem.update({ where: { id }, data });
  else await db.programItem.create({ data });
  revalidatePath('/admin/content');
  revalidatePath('/festival');
  revalidatePath('/');
  return { ok: true, message: 'Сохранено' };
}

export async function deleteProgramAction(fd: FormData) {
  await requireAdmin();
  await db.programItem.delete({ where: { id: str(fd.get('id')) } }).catch(() => null);
  revalidatePath('/admin/content');
  revalidatePath('/festival');
}

export async function savePartnerAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    const id = optStr(fd.get('id'));
    const name = str(fd.get('name'), 200);
    if (!name) return { error: 'Укажите название' };
    const logo = await maybeImage(fd, 'logo');
    const data = {
      name,
      url: optStr(fd.get('url'), 500),
      kind: optStr(fd.get('kind'), 100),
      order: int(fd.get('order'), 0, -1000, 1000),
      published: fd.get('published') === 'on',
      ...(logo ? { logoId: logo.id } : {}),
    };
    if (id) {
      const old = await db.partner.findUnique({ where: { id } });
      await db.partner.update({ where: { id }, data });
      if (logo && old?.logoId) await deleteStoredFile(old.logoId);
    } else await db.partner.create({ data });
    revalidatePath('/admin/content');
    revalidatePath('/');
    return { ok: true, message: 'Сохранено' };
  } catch (e) {
    return fail(e);
  }
}

export async function deletePartnerAction(fd: FormData) {
  await requireAdmin();
  const p = await db.partner.findUnique({ where: { id: str(fd.get('id')) } });
  if (!p) return;
  await db.partner.delete({ where: { id: p.id } });
  if (p.logoId) await deleteStoredFile(p.logoId);
  revalidatePath('/admin/content');
  revalidatePath('/');
}

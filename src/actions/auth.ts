'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { createSession, destroySession, getCurrentUser, hashPassword, rateLimit, verifyPassword, requireUser } from '@/lib/auth';
import { findValidToken, sendPasswordReset, sendVerification } from '@/lib/email-tokens';
import { isEmail, str } from '@/lib/utils';
import type { ActionState } from '@/components/ui/Form';

async function clientIp() {
  const h = await headers();
  return h.get('x-real-ip') || h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
}

function safeNext(next: string) {
  return next.startsWith('/') && !next.startsWith('//') ? next : '/app';
}

export async function registerAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const name = str(fd.get('name'), 120);
  const email = str(fd.get('email'), 200).toLowerCase();
  const password = str(fd.get('password'), 200);
  const next = safeNext(str(fd.get('next')) || '/app');
  if (!rateLimit(`reg:${await clientIp()}`, 10)) return { error: 'Слишком много попыток. Попробуйте позже.' };
  if (name.length < 2) return { error: 'Укажите имя' };
  if (!isEmail(email)) return { error: 'Проверьте адрес электронной почты' };
  if (password.length < 8) return { error: 'Пароль должен быть не короче 8 символов' };
  if (fd.get('consent') !== 'on') return { error: 'Нужно согласие с условиями и политикой обработки данных' };
  const exists = await db.user.findUnique({ where: { email } });
  if (exists) return { error: 'Пользователь с такой почтой уже зарегистрирован. Войдите.' };
  const user = await db.user.create({ data: { name, email, passwordHash: await hashPassword(password) } });
  await createSession(user.id, user.sessionVer);
  try {
    await sendVerification(user, next);
  } catch (e) {
    console.error('verify mail failed', e);
  }
  redirect('/verify-email');
}

export async function resendVerificationAction(_: ActionState): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.emailVerifiedAt) redirect('/app');
  if (!rateLimit(`resend:${user.id}`, 3, 15 * 60 * 1000)) return { error: 'Письмо уже отправлено несколько раз. Подождите 15 минут.' };
  const pending = await db.emailToken.findFirst({ where: { userId: user.id, kind: 'VERIFY', usedAt: null }, select: { next: true } });
  try {
    await sendVerification(user, pending?.next);
  } catch (e) {
    console.error('verify mail failed', e);
    return { error: 'Не удалось отправить письмо. Попробуйте позже или напишите нам.' };
  }
  return { ok: true, message: `Письмо отправлено на ${user.email}` };
}

export async function changeUnverifiedEmailAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.emailVerifiedAt) redirect('/app');
  const email = str(fd.get('email'), 200).toLowerCase();
  if (!isEmail(email)) return { error: 'Проверьте адрес электронной почты' };
  if (!rateLimit(`resend:${user.id}`, 3, 15 * 60 * 1000)) return { error: 'Слишком много попыток. Подождите 15 минут.' };
  if (email !== user.email) {
    if (await db.user.findUnique({ where: { email } })) return { error: 'Этот адрес уже занят другим аккаунтом' };
    await db.user.update({ where: { id: user.id }, data: { email } });
  }
  try {
    await sendVerification({ ...user, email });
  } catch (e) {
    console.error('verify mail failed', e);
    return { error: 'Не удалось отправить письмо. Попробуйте позже.' };
  }
  return { ok: true, message: `Письмо отправлено на ${email}` };
}

export async function forgotPasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd.get('email'), 200).toLowerCase();
  if (!isEmail(email)) return { error: 'Проверьте адрес электронной почты' };
  if (!rateLimit(`forgot:${await clientIp()}`, 5) || !rateLimit(`forgot:${email}`, 3)) {
    return { error: 'Слишком много запросов. Попробуйте позже.' };
  }
  const user = await db.user.findUnique({ where: { email } });
  if (user && !user.isBlocked) {
    try {
      await sendPasswordReset(user);
    } catch (e) {
      console.error('reset mail failed', e);
      return { error: 'Не удалось отправить письмо. Попробуйте позже.' };
    }
  }
  return { ok: true, message: 'Если такой адрес зарегистрирован, мы отправили на него ссылку для смены пароля. Проверьте также папку «Спам».' };
}

export async function resetPasswordByTokenAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const token = str(fd.get('token'), 200);
  const password = str(fd.get('password'), 200);
  if (password.length < 8) return { error: 'Пароль должен быть не короче 8 символов' };
  const row = await findValidToken(token, 'RESET');
  if (!row) return { error: 'Ссылка устарела или уже использована. Запросите новую.' };
  const [, user] = await db.$transaction([
    db.emailToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    db.user.update({
      where: { id: row.userId },
      data: { passwordHash: await hashPassword(password), sessionVer: { increment: 1 }, emailVerifiedAt: row.user.emailVerifiedAt ?? new Date() },
    }),
  ]);
  await createSession(user.id, user.sessionVer);
  redirect(user.role === 'ADMIN' ? '/admin' : '/app');
}

export async function loginAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd.get('email'), 200).toLowerCase();
  const password = str(fd.get('password'), 200);
  const next = str(fd.get('next'));
  if (!rateLimit(`login:${await clientIp()}:${email}`, 8)) return { error: 'Слишком много попыток. Подождите 10 минут.' };
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) return { error: 'Неверная почта или пароль' };
  if (user.isBlocked) return { error: 'Учётная запись заблокирована. Напишите в поддержку.' };
  await createSession(user.id, user.sessionVer);
  redirect(next ? safeNext(next) : user.role === 'ADMIN' ? '/admin' : '/app');
}

export async function logoutAction() {
  await destroySession();
  redirect('/');
}

export async function updateProfileAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const name = str(fd.get('name'), 120);
  const phone = str(fd.get('phone'), 40) || null;
  if (name.length < 2) return { error: 'Укажите имя' };
  await db.user.update({ where: { id: user.id }, data: { name, phone } });
  return { ok: true, message: 'Профиль сохранён' };
}

export async function changePasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const current = str(fd.get('current'), 200);
  const next = str(fd.get('next'), 200);
  if (!(await verifyPassword(current, user.passwordHash))) return { error: 'Текущий пароль указан неверно' };
  if (next.length < 8) return { error: 'Новый пароль должен быть не короче 8 символов' };
  const updated = await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next), sessionVer: { increment: 1 } },
  });
  await createSession(updated.id, updated.sessionVer);
  return { ok: true, message: 'Пароль изменён. Другие устройства вышли из аккаунта.' };
}

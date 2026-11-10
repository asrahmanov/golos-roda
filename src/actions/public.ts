'use server';

import { headers } from 'next/headers';
import type { RequestKind } from '@prisma/client';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { int, isEmail, optStr, str } from '@/lib/utils';
import { FESTIVAL_ZONE_NAMES } from '@/lib/constants';
import type { ActionState } from '@/components/ui/Form';

async function ip() {
  const h = await headers();
  return h.get('x-real-ip') || h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
}

export async function festivalRegisterAction(_: ActionState, fd: FormData): Promise<ActionState> {
  if (fd.get('website')) return { ok: true, message: 'Спасибо!' };
  if (!rateLimit(`fest:${await ip()}`, 6, 60 * 60 * 1000)) return { error: 'Слишком много заявок с вашего адреса. Попробуйте позже.' };
  const settings = await getSettings();
  if (settings.registrationOpen !== 'true') return { error: 'Регистрация на фестиваль сейчас закрыта' };
  const name = str(fd.get('name'), 120);
  const phone = str(fd.get('phone'), 40);
  const email = optStr(fd.get('email'), 200);
  if (name.length < 2) return { error: 'Укажите имя' };
  if (phone.replace(/\D/g, '').length < 10) return { error: 'Укажите телефон для связи' };
  if (email && !isEmail(email)) return { error: 'Проверьте адрес почты' };
  if (fd.get('consent') !== 'on') return { error: 'Нужно согласие на обработку персональных данных' };
  const zones = fd.getAll('zones').map(String).filter((z) => FESTIVAL_ZONE_NAMES.includes(z));
  await db.festivalRegistration.create({
    data: {
      name,
      phone,
      email,
      familyName: optStr(fd.get('familyName'), 120),
      adults: int(fd.get('adults'), 1, 0, 20),
      children: int(fd.get('children'), 0, 0, 20),
      seniors: int(fd.get('seniors'), 0, 0, 20),
      zones,
      comment: optStr(fd.get('comment'), 2000),
      consent: true,
    },
  });
  return { ok: true, message: 'Заявка принята! Мы напомним о фестивале и пришлём детали ближе к дате.' };
}

const KINDS: RequestKind[] = ['DONATION', 'SPONSOR', 'VENUE', 'PROFESSIONAL', 'VOLUNTEER', 'OPERATOR', 'MEDIA', 'CONTACT'];

export async function partnerRequestAction(_: ActionState, fd: FormData): Promise<ActionState> {
  if (fd.get('website')) return { ok: true, message: 'Спасибо!' };
  if (!rateLimit(`req:${await ip()}`, 6, 60 * 60 * 1000)) return { error: 'Слишком много заявок. Попробуйте позже.' };
  const kindRaw = str(fd.get('kind')) as RequestKind;
  const kind = KINDS.includes(kindRaw) ? kindRaw : 'CONTACT';
  const name = str(fd.get('name'), 120);
  const email = optStr(fd.get('email'), 200);
  const phone = optStr(fd.get('phone'), 40);
  const message = str(fd.get('message'), 4000);
  if (name.length < 2) return { error: 'Укажите имя' };
  if (!email && !phone) return { error: 'Оставьте почту или телефон для связи' };
  if (email && !isEmail(email)) return { error: 'Проверьте адрес почты' };
  if (message.length < 5) return { error: 'Расскажите коротко, чем хотите помочь' };
  if (fd.get('consent') !== 'on') return { error: 'Нужно согласие на обработку персональных данных' };
  await db.partnerRequest.create({
    data: { kind, name, email, phone, message, organization: optStr(fd.get('organization'), 200) },
  });
  return { ok: true, message: 'Спасибо! Команда «Легенда» свяжется с вами в ближайшее время.' };
}

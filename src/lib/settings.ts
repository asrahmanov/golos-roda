import 'server-only';
import { cache } from 'react';
import { db } from './db';

export const DEFAULT_SETTINGS = {
  heroEyebrow: 'Общественный социально-культурный проект · Москва',
  heroTitle: 'Связь поколений',
  heroSubtitle: 'Сохраняя прошлое, мы объединяем людей в настоящем и оставляем наследие будущему.',
  announcement: 'Семейный фестиваль «Связь поколений» — 22 ноября 2026 года. Регистрация открыта.',
  festivalDate: '2026-11-22T11:00:00+03:00',
  festivalDateText: '22 ноября 2026',
  festivalVenue: 'Площадка уточняется',
  festivalAddress: 'Москва',
  launchDateText: 'до 28 ноября 2026',
  contactEmail: 'info@svyaz-pokoleny.ru',
  contactPhone: '',
  telegram: '',
  vk: '',
  donationUrl: '',
  donationText:
    'Сбор средств откроется после утверждения законной схемы приёма пожертвований. Оставьте заявку — мы свяжемся с вами и расскажем, как помочь.',
  donationQrId: '',
  kpiFamiliesTarget: '100',
  kpiTreesTarget: '50',
  budgetText: '≈ 500 000 ₽ — предварительный ориентир бюджета фестиваля',
  showLiveStats: 'true',
  registrationOpen: 'true',
};

export type Settings = typeof DEFAULT_SETTINGS;
export type SettingKey = keyof Settings;

export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await db.setting.findMany();
  const s: Settings = { ...DEFAULT_SETTINGS };
  for (const r of rows) {
    if (r.key in s) (s as Record<string, string>)[r.key] = r.value;
  }
  return s;
});

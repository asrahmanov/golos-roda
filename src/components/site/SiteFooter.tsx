import Link from 'next/link';
import { Mail, Phone, Send } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import type { Settings } from '@/lib/settings';

export function SiteFooter({ settings }: { settings: Settings }) {
  return (
    <footer className="relative overflow-hidden bg-ink-950 text-cream-100/70">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-gold-500/10 blur-3xl" />
      <div className="container-x relative grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo dark />
          <p className="mt-5 max-w-sm text-sm leading-relaxed">
            Общественный социально-культурный проект команды «Легенда» (тренинг «Парадокс»). Сохраняем память, объединяем поколения,
            оставляем наследие будущему.
          </p>
        </div>
        <div>
          <h4 className="eyebrow mb-4">Проект</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link className="hover:text-cream-50" href="/#mission">Миссия</Link></li>
            <li><Link className="hover:text-cream-50" href="/#platform">Платформа</Link></li>
            <li><Link className="hover:text-cream-50" href="/#sculpture">Арт-объект</Link></li>
            <li><Link className="hover:text-cream-50" href="/#roadmap">Дорожная карта</Link></li>
            <li><Link className="hover:text-cream-50" href="/news">Новости</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="eyebrow mb-4">Участникам</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link className="hover:text-cream-50" href="/register">Создать дерево</Link></li>
            <li><Link className="hover:text-cream-50" href="/festival">Фестиваль {settings.festivalDateText}</Link></li>
            <li><Link className="hover:text-cream-50" href="/stories">Истории семей</Link></li>
            <li><Link className="hover:text-cream-50" href="/support">Стать партнёром</Link></li>
            <li><Link className="hover:text-cream-50" href="/#faq">Вопросы и ответы</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="eyebrow mb-4">Связь</h4>
          <ul className="space-y-3 text-sm">
            {settings.contactEmail && (
              <li>
                <a className="flex items-center gap-2 hover:text-cream-50" href={`mailto:${settings.contactEmail}`}>
                  <Mail className="h-4 w-4 text-gold-400" /> {settings.contactEmail}
                </a>
              </li>
            )}
            {settings.contactPhone && (
              <li>
                <a className="flex items-center gap-2 hover:text-cream-50" href={`tel:${settings.contactPhone.replace(/[^\d+]/g, '')}`}>
                  <Phone className="h-4 w-4 text-gold-400" /> {settings.contactPhone}
                </a>
              </li>
            )}
            {settings.telegram && (
              <li>
                <a className="flex items-center gap-2 hover:text-cream-50" href={settings.telegram} target="_blank" rel="noreferrer">
                  <Send className="h-4 w-4 text-gold-400" /> Telegram
                </a>
              </li>
            )}
            {settings.vk && (
              <li>
                <a className="flex items-center gap-2 hover:text-cream-50" href={settings.vk} target="_blank" rel="noreferrer">
                  <span className="grid h-4 w-4 place-items-center text-[9px] font-black text-gold-400">VK</span> ВКонтакте
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/6">
        <div className="container-x flex flex-col gap-3 py-6 text-xs text-cream-100/45 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 «Связь поколений» · Команда «Легенда»</span>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-cream-50">Политика конфиденциальности</Link>
            <Link href="/terms" className="hover:text-cream-50">Условия использования</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, BookHeart, CalendarCheck, Handshake, Home, LayoutTemplate, LifeBuoy, ListChecks, Newspaper, Network, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminNav({ badges }: { badges: Record<string, number> }) {
  const pathname = usePathname();
  const items = [
    { href: '/admin', label: 'Дашборд', I: BarChart3, exact: true },
    { href: '/admin/registrations', label: 'Фестиваль', I: CalendarCheck, b: badges.registrations },
    { href: '/admin/requests', label: 'Партнёры', I: Handshake, b: badges.requests },
    { href: '/admin/stories', label: 'Модерация', I: BookHeart, b: badges.stories },
    { href: '/admin/support', label: 'Поддержка', I: LifeBuoy, b: badges.tickets },
    { href: '/admin/users', label: 'Пользователи', I: Users },
    { href: '/admin/families', label: 'Семьи', I: Network },
    { href: '/admin/tasks', label: 'Задания', I: ListChecks },
    { href: '/admin/news', label: 'Новости', I: Newspaper },
    { href: '/admin/content', label: 'Контент сайта', I: LayoutTemplate },
  ];
  return (
    <nav className="scrollbar-none flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {items.map((it) => {
        const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              'flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition',
              active ? 'bg-gold-500 text-ink-950' : 'text-cream-100/70 hover:bg-white/5 hover:text-cream-50',
            )}
          >
            <it.I className="h-4 w-4" />
            <span className="flex-1">{it.label}</span>
            {!!it.b && <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', active ? 'bg-ink-950 text-gold-300' : 'bg-gold-500 text-ink-950')}>{it.b}</span>}
          </Link>
        );
      })}
      <Link href="/" className="flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-cream-100/50 hover:text-cream-50 lg:mt-6">
        <Home className="h-4 w-4" /> На сайт
      </Link>
    </nav>
  );
}

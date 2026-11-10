'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Activity, Archive, BookHeart, GitFork, ListChecks, Settings, Users, UsersRound } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FamilyTabs({ familyId }: { familyId: string }) {
  const pathname = usePathname();
  const base = `/app/family/${familyId}`;
  const tabs = [
    { href: base, label: 'Дерево', I: GitFork, exact: true },
    { href: `${base}/people`, label: 'Люди', I: UsersRound, also: `${base}/person` },
    { href: `${base}/archive`, label: 'Архив', I: Archive },
    { href: `${base}/tasks`, label: 'Задания', I: ListChecks },
    { href: `${base}/feed`, label: 'Лента', I: Activity },
    { href: `${base}/members`, label: 'Участники', I: Users },
    { href: `${base}/stories`, label: 'Истории', I: BookHeart },
    { href: `${base}/settings`, label: 'Настройки', I: Settings },
  ];
  return (
    <nav className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {tabs.map((t) => {
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href) || (t.also && pathname.startsWith(t.also));
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              'relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition',
              active ? 'text-cream-50' : 'text-ink-600 hover:bg-ink-900/5',
            )}
          >
            {active && <motion.span layoutId="family-tab" className="absolute inset-0 rounded-full bg-ink-900" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
            <t.I className={cn('relative h-4 w-4', active && 'text-gold-300')} />
            <span className="relative">{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

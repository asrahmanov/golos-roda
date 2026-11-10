'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Home, LifeBuoy, LogOut, Shield, UserRound } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { logoutAction } from '@/actions/auth';
import { cn, initials } from '@/lib/utils';

export function AppHeader({ name, isAdmin }: { name: string; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const on = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', on);
    return () => document.removeEventListener('mousedown', on);
  }, []);

  const links = [
    { href: '/app', label: 'Мои семьи', I: Home },
    { href: '/app/support', label: 'Поддержка', I: LifeBuoy },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-ink-900/6 bg-cream-50/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo href="/app" />
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition',
                  pathname === l.href ? 'bg-ink-900 text-cream-50' : 'text-ink-600 hover:bg-ink-900/5',
                )}
              >
                {l.label}
              </Link>
            ))}
            <Link href="/" className="rounded-full px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-900/5">
              О проекте
            </Link>
          </nav>
        </div>
        <div ref={ref} className="relative">
          <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-full p-1 pr-3 transition hover:bg-ink-900/5" aria-expanded={open}>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-ink-900 text-xs font-bold text-gold-300">{initials(name)}</span>
            <span className="hidden max-w-[10rem] truncate text-sm font-semibold sm:block">{name}</span>
            <ChevronDown className={cn('h-4 w-4 text-ink-400 transition', open && 'rotate-180')} />
          </button>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl bg-white p-1.5 shadow-2xl ring-1 ring-ink-900/8"
              >
                {[...links, { href: '/app/profile', label: 'Профиль и безопасность', I: UserRound }, ...(isAdmin ? [{ href: '/admin', label: 'Админ-панель', I: Shield }] : [])].map((l) => (
                  <Link key={l.href} href={l.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-cream-100">
                    <l.I className="h-4 w-4 text-ink-400" /> {l.label}
                  </Link>
                ))}
                <form action={logoutAction}>
                  <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-rose-500 hover:bg-rose-500/8">
                    <LogOut className="h-4 w-4" /> Выйти
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

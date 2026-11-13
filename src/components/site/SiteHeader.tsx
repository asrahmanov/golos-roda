'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/#mission', label: 'О проекте' },
  { href: '/#platform', label: 'Платформа' },
  { href: '/festival', label: 'Фестиваль' },
  { href: '/stories', label: 'Истории' },
  { href: '/news', label: 'Новости' },
  { href: '/support', label: 'Поддержать' },
];

export function SiteHeader({ loggedIn, announcement }: { loggedIn: boolean; announcement?: string }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const overDark = pathname === '/' || pathname === '/festival' || pathname === '/support';

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
  }, [open]);

  const dark = overDark && !scrolled;

  return (
    <>
      {announcement && (
        <div className="relative z-50 bg-gold-500 text-ink-950">
          <Link href="/festival" className="container-x flex items-center justify-center gap-2 py-2 text-center text-xs font-semibold sm:text-[13px]">
            <span className="line-clamp-1">{announcement}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" />
          </Link>
        </div>
      )}
      <header
        className={cn(
          'sticky top-0 z-40 transition-all duration-500',
          scrolled ? 'bg-cream-50/85 shadow-[0_1px_0_rgba(11,23,18,0.06)] backdrop-blur-xl' : overDark ? 'bg-ink-900' : 'bg-cream-50',
        )}
      >
        <div className="container-x flex h-16 items-center justify-between gap-6 sm:h-20">
          <Logo dark={dark} />
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  'nav-link relative px-4 py-2 text-sm font-medium transition-colors',
                  dark ? 'text-cream-100/80 hover:text-cream-50' : 'text-ink-700 hover:text-ink-900',
                  pathname === n.href && (dark ? 'text-gold-300' : 'text-gold-600'),
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            {loggedIn ? (
              <Link href="/app" className="btn-gold btn-sm">
                Моя летопись
              </Link>
            ) : (
              <>
                <Link href="/login" className={cn('btn-sm btn', dark ? 'text-cream-50 hover:bg-white/10' : 'text-ink-800 hover:bg-ink-900/5')}>
                  Войти
                </Link>
                <Link href="/register" data-magnetic className="btn-gold btn-sm">
                  Создать летопись
                </Link>
              </>
            )}
          </div>
          <button
            className={cn('-mr-2 rounded-full p-2.5 lg:hidden', dark ? 'text-cream-50' : 'text-ink-900')}
            onClick={() => setOpen(true)}
            aria-label="Открыть меню"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex flex-col bg-ink-900 text-cream-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="container-x flex h-16 items-center justify-between">
              <Logo dark />
              <button onClick={() => setOpen(false)} className="-mr-2 rounded-full p-2.5" aria-label="Закрыть меню">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="container-x mt-6 flex flex-1 flex-col gap-1">
              {NAV.map((n, i) => (
                <motion.div key={n.href} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}>
                  <Link href={n.href} onClick={() => setOpen(false)} className="block border-b border-white/8 py-4 font-serif text-3xl">
                    {n.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="container-x grid gap-3 pb-10">
              {loggedIn ? (
                <Link href="/app" className="btn-gold w-full">
                  Моя летопись
                </Link>
              ) : (
                <>
                  <Link href="/register" className="btn-gold w-full">
                    Создать летопись
                  </Link>
                  <Link href="/login" className="btn-ghost w-full">
                    Войти
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

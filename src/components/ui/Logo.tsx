import Link from 'next/link';
import { cn } from '@/lib/utils';

export function InfinityMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 32" className={className} fill="none" aria-hidden>
      <path
        d="M32 16c-5-7-9-11-15-11a11 11 0 0 0 0 22c6 0 10-4 15-11zm0 0c5 7 9 11 15 11a11 11 0 0 0 0-22c-6 0-10 4-15 11z"
        stroke="currentColor"
        strokeWidth="3.2"
        pathLength={1}
        strokeLinecap="round"
      />
      <circle cx="32" cy="16" r="3" className="fill-gold-300" />
    </svg>
  );
}

export function Logo({ dark = false, href = '/', className }: { dark?: boolean; href?: string; className?: string }) {
  return (
    <Link href={href} className={cn('group inline-flex items-center gap-2.5', className)} aria-label="Связь поколений — на главную">
      <InfinityMark className="logo-mark h-6 w-12 text-gold-500 transition-transform duration-500 group-hover:scale-110" />
      <span className={cn('font-serif text-[19px] font-semibold leading-none tracking-tight', dark ? 'text-cream-50' : 'text-ink-900')}>
        Связь поколений
      </span>
    </Link>
  );
}

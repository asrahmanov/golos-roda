import { cn } from '@/lib/utils';

function Knot() {
  return (
    <svg viewBox="0 0 40 20" className="mx-6 h-5 w-10 shrink-0 text-gold-500 sm:mx-10 sm:h-7 sm:w-14" fill="none" aria-hidden>
      <path d="M20 10c-3-4-5.5-6.5-9-6.5a6.5 6.5 0 0 0 0 13c3.5 0 6-2.5 9-6.5zm0 0c3 4 5.5 6.5 9 6.5a6.5 6.5 0 0 0 0-13c-3.5 0-6 2.5-9 6.5z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function Marquee({ words, dark = false, reverse = false, className }: { words: string[]; dark?: boolean; reverse?: boolean; className?: string }) {
  const row = (
    <div className="flex shrink-0 items-center" aria-hidden>
      {words.map((w, i) => (
        <span key={i} className="flex items-center">
          <span className={cn('font-serif text-[clamp(2.4rem,6vw,5.5rem)] font-semibold italic leading-none tracking-tight', i % 2 ? 'text-outline' : '')}>{w}</span>
          <Knot />
        </span>
      ))}
    </div>
  );
  return (
    <div className={cn('marquee relative flex overflow-hidden py-8 select-none sm:py-12', dark ? 'bg-ink-950 text-cream-50' : 'text-ink-900', className)}>
      <span className="sr-only">{words.join(', ')}</span>
      <div className={cn('marquee-track flex', reverse && 'marquee-reverse')}>
        {row}
        {row}
      </div>
    </div>
  );
}

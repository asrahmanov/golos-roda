'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor((ms / 3600000) % 24),
    minutes: Math.floor((ms / 60000) % 60),
    seconds: Math.floor((ms / 1000) % 60),
    done: ms === 0,
  };
}

export function Countdown({ target, light = false }: { target: string; light?: boolean }) {
  const t = new Date(target).getTime();
  const [d, setD] = useState<ReturnType<typeof diff> | null>(null);
  useEffect(() => {
    setD(diff(t));
    const id = setInterval(() => setD(diff(t)), 1000);
    return () => clearInterval(id);
  }, [t]);

  if (Number.isNaN(t)) return null;
  if (d?.done) {
    return <p className={cn('font-serif text-xl italic', light ? 'text-ink-700' : 'text-gold-300')}>Фестиваль уже состоялся — спасибо всем семьям!</p>;
  }
  const items = [
    { v: d?.days, l: 'дней' },
    { v: d?.hours, l: 'часов' },
    { v: d?.minutes, l: 'минут' },
    { v: d?.seconds, l: 'секунд' },
  ];
  return (
    <div>
      <p className={cn('mb-3 text-xs font-semibold uppercase tracking-[0.2em]', light ? 'text-ink-500' : 'text-cream-100/50')}>До фестиваля</p>
      <div className="flex gap-2 sm:gap-3">
        {items.map((i) => (
          <div
            key={i.l}
            className={cn(
              'min-w-[4.2rem] rounded-2xl px-3 py-3 text-center backdrop-blur sm:min-w-[5rem]',
              light ? 'bg-white ring-1 ring-ink-900/8' : 'bg-white/[0.06] ring-1 ring-white/10',
            )}
          >
            <div className={cn('font-serif text-2xl font-semibold tabular-nums sm:text-3xl', light ? 'text-ink-900' : 'text-cream-50')}>
              {d ? String(i.v).padStart(2, '0') : '––'}
            </div>
            <div className={cn('mt-0.5 text-[10px] uppercase tracking-wider', light ? 'text-ink-500' : 'text-cream-100/50')}>{i.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

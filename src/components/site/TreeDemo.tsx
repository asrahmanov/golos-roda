'use client';

import { motion } from 'framer-motion';
import { BrandIcon, type BrandIconName } from '@/components/ui/BrandIcon';

type N = { id: string; x: number; y: number; name: string; years: string; tone: 'gold' | 'ink' | 'cream' };

const NODES: N[] = [
  { id: 'a', x: 29, y: 13, name: 'Анна', years: '1928 — 2011', tone: 'cream' },
  { id: 'b', x: 71, y: 13, name: 'Пётр', years: '1925 — 1998', tone: 'cream' },
  { id: 'c', x: 29, y: 48, name: 'Мария', years: 'род. 1956', tone: 'gold' },
  { id: 'd', x: 71, y: 48, name: 'Сергей', years: 'род. 1954', tone: 'ink' },
  { id: 'e', x: 29, y: 83, name: 'Ольга', years: 'род. 1984', tone: 'ink' },
  { id: 'f', x: 71, y: 83, name: 'Дмитрий', years: 'род. 1988', tone: 'gold' },
];

const PATHS = [
  'M 29 13 H 71',
  'M 50 13 V 30.5 H 29 V 48',
  'M 29 48 H 71',
  'M 50 48 V 65.5',
  'M 29 65.5 H 71',
  'M 29 65.5 V 83',
  'M 71 65.5 V 83',
];

export function TreeDemo() {
  return (
    <div className="relative aspect-[5/4] w-full overflow-hidden rounded-[2rem] bg-ink-900 p-4 shadow-2xl ring-1 ring-white/10 sm:p-6">
      <div className="grain pointer-events-none absolute inset-0 opacity-[0.06]" />
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-gold-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-sage-500/70" />
        <span className="ml-3 text-[11px] text-cream-100/40">Семья Ивановых · дерево</span>
      </div>
      <div className="relative mt-3 h-[calc(100%-1.75rem)]">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          {PATHS.map((d, i) => (
            <motion.path
              key={i}
              d={d}
              stroke="#d9a86c"
              strokeOpacity="0.6"
              strokeWidth="0.4"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.5 + i * 0.15 }}
            />
          ))}
        </svg>
        {NODES.map((n, i) => (
          <motion.div
            key={n.id}
            className="absolute"
            style={{ left: `${n.x}%`, top: `${n.y}%`, x: '-50%', y: '-50%' }}
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 160, damping: 16, delay: 0.15 * i }}
          >
            <div
              className={
                'flex items-center gap-2 whitespace-nowrap rounded-xl px-2 py-1.5 shadow-lg sm:gap-2.5 sm:px-3 sm:py-2 ' +
                (n.tone === 'gold' ? 'bg-gold-500 text-ink-950' : n.tone === 'cream' ? 'bg-cream-100 text-ink-900' : 'bg-ink-700 text-cream-50 ring-1 ring-white/10')
              }
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-black/10 font-serif text-[11px] font-bold sm:h-8 sm:w-8 sm:text-sm">
                {n.name[0]}
              </span>
              <span className="leading-tight">
                <span className="block text-[11px] font-bold sm:text-sm">{n.name}</span>
                <span className="block text-[9px] opacity-70 sm:text-[11px]">{n.years}</span>
              </span>
            </div>
          </motion.div>
        ))}
        <motion.div
          className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 gap-1.5"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1.8 }}
        >
          {(['camera', 'mic', 'letter'] as BrandIconName[]).map((n) => (
            <span key={n} className="grid h-9 w-9 place-items-center rounded-full bg-white/8 text-cream-50 ring-1 ring-white/10">
              <BrandIcon name={n} draw={false} accent="#e3b77e" strokeWidth={2.2} className="h-5 w-5" />
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

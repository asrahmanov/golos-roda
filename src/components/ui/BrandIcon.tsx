'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

type Part = { d: string; accent?: boolean; fill?: boolean };

const c = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
const e = (cx: number, cy: number, rx: number, ry: number) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
const r = (x: number, y: number, w: number, h: number, rr = 0) =>
  rr
    ? `M${x + rr} ${y}h${w - 2 * rr}a${rr} ${rr} 0 0 1 ${rr} ${rr}v${h - 2 * rr}a${rr} ${rr} 0 0 1 ${-rr} ${rr}h${-(w - 2 * rr)}a${rr} ${rr} 0 0 1 ${-rr} ${-rr}v${-(h - 2 * rr)}a${rr} ${rr} 0 0 1 ${rr} ${-rr}z`
    : `M${x} ${y}h${w}v${h}h${-w}z`;
const heart = (cx: number, cy: number, s: number) =>
  `M${cx} ${cy + 6 * s}c${-4.2 * s} ${-2.6 * s} ${-6.5 * s} ${-5.2 * s} ${-6.5 * s} ${-8 * s}a${3.4 * s} ${3.4 * s} 0 0 1 ${6.5 * s} ${-1.6 * s}a${3.4 * s} ${3.4 * s} 0 0 1 ${6.5 * s} ${1.6 * s}c0 ${2.8 * s} ${-2.3 * s} ${5.4 * s} ${-6.5 * s} ${8 * s}z`;
const inf = (cx: number, cy: number, s: number) =>
  `M${cx} ${cy}c${-2 * s} ${-2.7 * s} ${-3.4 * s} ${-4 * s} ${-5.3 * s} ${-4 * s}a${4 * s} ${4 * s} 0 0 0 0 ${8 * s}c${1.9 * s} 0 ${3.3 * s} ${-1.3 * s} ${5.3 * s} ${-4 * s}zm0 0c${2 * s} ${2.7 * s} ${3.4 * s} ${4 * s} ${5.3 * s} ${4 * s}a${4 * s} ${4 * s} 0 0 0 0 ${-8 * s}c${-1.9 * s} 0 ${-3.3 * s} ${1.3 * s} ${-5.3 * s} ${4 * s}z`;

const ICONS = {
  /* Проблема */
  'voice-fade': [
    { d: 'M7 9h15a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4h-9l-5 4.5V24H7a4 4 0 0 1-4-4v-7a4 4 0 0 1 4-4z' },
    { d: 'M8.5 14.5h12M8.5 18.5h8' },
    { d: c(31, 13, 1.6), accent: true, fill: true },
    { d: c(35, 18.5, 1.2), accent: true, fill: true },
    { d: c(32, 24, 0.9), accent: true, fill: true },
  ],
  scatter: [
    { d: 'M5.2 9.6l12.9-2.3 2 11.8-12.9 2.3z' },
    { d: 'M21.6 13.4l12.8 2.6-2.4 11.7-12.8-2.6z' },
    { d: 'M9.5 25.2l11.8.6-.6 9.8-11.8-.6z' },
    { d: 'M7.6 18.6l3.6-3.8 3 2.6 2.2-2 2.3 2.4', accent: true },
    { d: c(13, 11.8, 1.3), accent: true, fill: true },
  ],
  'infinity-broken': [
    { d: 'M18 20c-2.6-3.6-5-6.5-8.6-6.5a6.5 6.5 0 0 0 0 13c3.6 0 6-2.9 8.6-6.5' },
    { d: 'M22 20c2.6 3.6 5 6.5 8.6 6.5a6.5 6.5 0 0 0 0-13c-3.6 0-6 2.9-8.6 6.5' },
    { d: c(20, 20, 1.1), accent: true, fill: true },
    { d: 'M20 13.5v-2.5M20 29v-2.5', accent: true },
  ],

  /* Платформа */
  tree: [
    { d: c(12, 9, 3.5) },
    { d: c(28, 9, 3.5) },
    { d: 'M15.5 9h9M20 9v9.5' },
    { d: c(20, 22, 3.5), accent: true, fill: true },
    { d: 'M20 25.5V28M11 28h18M11 28v1.5M29 28v1.5' },
    { d: c(11, 33, 3.5) },
    { d: c(29, 33, 3.5) },
  ],
  cameo: [
    { d: e(20, 20.5, 11, 14) },
    { d: c(20, 16.5, 3.6) },
    { d: 'M13.2 28.5c1.2-4 3.7-6.4 6.8-6.4s5.6 2.4 6.8 6.4' },
    { d: c(20, 4.5, 1.5), accent: true, fill: true },
    { d: 'M16.5 36.5l3.5-2 3.5 2', accent: true },
  ],
  archive: [
    { d: 'M5 13.5h30v4.5H5z' },
    { d: 'M7 18v13.5a2.5 2.5 0 0 0 2.5 2.5h21a2.5 2.5 0 0 0 2.5-2.5V18' },
    { d: 'M11.5 13.5l1.8-7.2 9.6 2.4-1.2 4.8' },
    { d: 'M24.5 13.5l.8-6h9l-.8 6' },
    { d: 'M16 24h8' },
    { d: c(29.4, 10.4, 1.6), accent: true, fill: true },
  ],
  together: [
    { d: c(20, 11, 4.5) },
    { d: c(9.5, 15, 3.5) },
    { d: c(30.5, 15, 3.5) },
    { d: 'M3.5 31c0-5 2.6-8.5 6-8.5M36.5 31c0-5-2.6-8.5-6-8.5' },
    { d: 'M11.5 34c0-6.5 3.8-11 8.5-11s8.5 4.5 8.5 11' },
    { d: heart(20, 26.2, 0.42), accent: true, fill: true },
  ],
  privacy: [
    { d: 'M20 34.5S5.5 26 5.5 15.5A7.3 7.3 0 0 1 20 12.2a7.3 7.3 0 0 1 14.5 3.3C34.5 26 20 34.5 20 34.5z' },
    { d: c(20, 19.5, 2.6), accent: true, fill: true },
    { d: 'M18.8 21.5h2.4l1 5.5h-4.4z', accent: true, fill: true },
  ],

  /* Задания и зоны */
  mic: [
    { d: r(14, 3.5, 12, 19, 6) },
    { d: 'M14 10h12M14 14h12M14 18h12' },
    { d: 'M9.5 18.5a10.5 10.5 0 0 0 21 0M20 29v5.5M14 35h12' },
    { d: 'M33.5 9.5c1.6 2 1.6 6 0 8M36.5 7c2.8 3.4 2.8 9.6 0 13', accent: true },
  ],
  camera: [
    { d: r(4, 12, 32, 21, 3.5) },
    { d: 'M13 12l2.2-4.5h9.6L27 12' },
    { d: c(20, 22.5, 6.5) },
    { d: c(20, 22.5, 2.8), accent: true, fill: true },
    { d: 'M29 16h3', accent: true },
  ],
  relic: [
    { d: c(20, 23, 11) },
    { d: c(20, 6.2, 2.2) },
    { d: 'M18.2 8.4h3.6v3.6h-3.6z' },
    { d: 'M20 23v-6.5M20 23l4.5 3' },
    { d: c(20, 23, 1.4), accent: true, fill: true },
    { d: 'M20 14v.01M29 23h-.01M20 32v.01M11 23h.01', accent: true },
  ],
  letter: [
    { d: r(4, 9.5, 32, 22, 2.5) },
    { d: 'M5 11l15 11 15-11' },
    { d: c(20, 24.5, 3.8), accent: true, fill: true },
    { d: 'M10 27l-4.5 3.5M30 27l4.5 3.5' },
  ],
  roots: [
    { d: c(17, 17, 10.5) },
    { d: 'M24.8 24.8L35 35' },
    { d: 'M17 11v6.5M17 17.5l-4 3.8M17 17.5l4 3.8M17 17.5v5.5', accent: true },
    { d: c(17, 10.5, 1.4), accent: true, fill: true },
  ],
  book: [
    { d: 'M20 10.5c-4.2-3.2-10-3.6-15-2.4v22.5c5-1.2 10.8-.8 15 2.4 4.2-3.2 10-3.6 15-2.4V8.1c-5-1.2-10.8-.8-15 2.4z' },
    { d: 'M20 10.5V33' },
    { d: 'M8.5 14c2.8-.4 5.5 0 7.5.9M8.5 19c2.8-.4 5.5 0 7.5.9' },
    { d: 'M25.5 8v12.5l2.5-2 2.5 2V7.4', accent: true, fill: true },
  ],
  pin: [
    { d: 'M20 36s11-9.6 11-19a11 11 0 0 0-22 0c0 9.4 11 19 11 19z' },
    { d: 'M14.5 18.5l5.5-4.5 5.5 4.5v5.5h-11z' },
    { d: 'M18.5 24v-3h3v3', accent: true, fill: true },
  ],
  pot: [
    { d: 'M7 18h26v7.5a8.5 8.5 0 0 1-8.5 8.5h-9A8.5 8.5 0 0 1 7 25.5z' },
    { d: 'M4.5 18h31M17.5 14.5h5' },
    { d: 'M14 10.5c-1.2-1.8 1.2-3.2 0-5M20 10.5c-1.2-1.8 1.2-3.2 0-5M26 10.5c-1.2-1.8 1.2-3.2 0-5', accent: true },
  ],
  gramophone: [
    { d: r(5, 28.5, 19, 6.5, 1.5) },
    { d: 'M14.5 28.5v-6' },
    { d: 'M14.5 22.5L30 7.5c2.6 4 3 10.2.2 14.6z' },
    { d: c(14.5, 22.5, 1.6), accent: true, fill: true },
    { d: 'M33 26.5l1.5-.5M31 31l1.4.8', accent: true },
  ],
  hearts: [
    { d: heart(17, 17.5, 1.45) },
    { d: heart(26.5, 21.5, 0.85), accent: true, fill: true },
  ],
  spark: [
    { d: 'M18 5c1 8 4 11 12 12-8 1-11 4-12 12-1-8-4-11-12-12 8-1 11-4 12-12z' },
    { d: 'M31 24c.5 3.4 1.6 4.5 5 5-3.4.5-4.5 1.6-5 5-.5-3.4-1.6-4.5-5-5 3.4-.5 4.5-1.6 5-5z', accent: true, fill: true },
  ],

  /* Поддержка */
  donate: [
    { d: heart(20, 11.5, 1), accent: true, fill: true },
    { d: 'M4 25.5l5.5-1.5 8.5 3.5h6.5a1.7 1.7 0 0 0 0-3.4H19' },
    { d: 'M19.5 27.5l9.2-4.6c2-1 3.8 1.4 2.1 3L24 32.5H13l-9-2.5' },
  ],
  venue: [
    { d: 'M4.5 14L20 5.5 35.5 14' },
    { d: 'M6 14h28M5 34h30M6.5 30.5h27' },
    { d: 'M9.5 17.5v13M16 17.5v13M24 17.5v13M30.5 17.5v13' },
    { d: c(20, 10.5, 1.6), accent: true, fill: true },
  ],
  craft: [
    { d: c(20, 9.5, 2.6) },
    { d: 'M20 4v3M18.6 11.6L11 34M21.4 11.6L29 34' },
    { d: 'M11.5 26.5c5.4 3.2 11.6 3.2 17 0', accent: true },
    { d: c(20, 9.5, 0.9), accent: true, fill: true },
  ],
  code: [
    { d: r(4, 7, 32, 22, 3) },
    { d: 'M14 34h12M20 29v5' },
    { d: 'M15 14l-4.5 4 4.5 4M25 14l4.5 4-4.5 4', accent: true },
    { d: 'M21.5 13l-3 10' },
  ],
  expert: [
    { d: c(17, 12, 5) },
    { d: 'M6.5 34c0-7 4.7-12 10.5-12 2.2 0 4.2.7 5.8 1.9' },
    { d: 'M24.5 29l3.5 3.5 7-7.5', accent: true },
  ],
  voice: [
    { d: 'M5 16.5v7h5l9 7v-21l-9 7z' },
    { d: 'M24.5 15.5c2.2 2.4 2.2 6.6 0 9M28.5 12c4.2 4.4 4.2 11.6 0 16M32.5 8.5c6 6.4 6 16.6 0 23', accent: true },
  ],
  operator: [
    { d: 'M20 4l13 5v9.5c0 8.2-5.6 14-13 17.5C12.6 32.5 7 26.7 7 18.5V9z' },
    { d: inf(20, 19.5, 0.95), accent: true },
  ],
  shield: [
    { d: 'M20 4l13 5v9.5c0 8.2-5.6 14-13 17.5C12.6 32.5 7 26.7 7 18.5V9z' },
    { d: 'M14 19.5l4.2 4.2 8-8.2', accent: true },
  ],

  /* Служебные */
  calendar: [
    { d: r(5, 8, 30, 27, 3.5) },
    { d: 'M5 15.5h30M13 4.5v6M27 4.5v6' },
    { d: c(26, 26, 3), accent: true, fill: true },
  ],
  clock: [
    { d: c(20, 20, 14) },
    { d: 'M20 11.5V20l6 3.5' },
    { d: c(20, 20, 1.4), accent: true, fill: true },
  ],
  family: [
    { d: c(13, 11, 4) },
    { d: c(27, 11, 4) },
    { d: 'M5 32c0-6.5 3.6-11 8-11s8 4.5 8 11M19 32c0-6.5 3.6-11 8-11s8 4.5 8 11' },
    { d: c(20, 27.5, 2.6), accent: true, fill: true },
  ],
  oak: [
    { d: 'M20 4.5a8 8 0 0 1 7.6 5.4A7 7 0 0 1 30 23.5H10a7 7 0 0 1 2.4-13.6A8 8 0 0 1 20 4.5z' },
    { d: 'M20 23.5V36M20 28l-4.5-3.5M20 26l4-3' },
    { d: 'M14 36h12' },
    { d: c(24.5, 14, 1.5), accent: true, fill: true },
  ],
  news: [
    { d: r(5, 6, 26, 28, 2.5) },
    { d: 'M31 12h3a1.5 1.5 0 0 1 1.5 1.5V31a3 3 0 0 1-6 0' },
    { d: 'M10 12h16M10 26h16M10 30h10' },
    { d: r(10, 16, 9, 6), accent: true, fill: true },
  ],
  celebrate: [
    { d: 'M6 35l7-19 11 11z' },
    { d: 'M10.5 23l6.5 6.5' },
    { d: 'M22 9c2-2 2-4 0-6M27 14c2.5-1.2 5-1 7 .5M25 6.5l1-2.5M33 9l2.5-1', accent: true },
    { d: c(31, 21, 1.4), accent: true, fill: true },
  ],
  infinity: [{ d: inf(20, 20, 1.9) }, { d: c(20, 20, 1.6), accent: true, fill: true }],
} satisfies Record<string, Part[]>;

export type BrandIconName = keyof typeof ICONS;

export function BrandIcon({
  name,
  className,
  accent = 'var(--brand-accent, #c58d4f)',
  strokeWidth = 1.6,
  draw = true,
  delay = 0,
}: {
  name: BrandIconName;
  className?: string;
  accent?: string;
  strokeWidth?: number;
  draw?: boolean;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const parts: Part[] = ICONS[name] ?? ICONS.spark;
  const animate = draw && !reduce;
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('brand-icon', className)}
      aria-hidden
    >
      {parts.map((p, i) => {
        const color = p.accent ? accent : 'currentColor';
        if (!animate) {
          return <path key={i} d={p.d} stroke={color} fill={p.fill ? color : 'none'} className={p.accent ? 'bi-accent' : undefined} />;
        }
        const t = { delay: delay + i * 0.09, duration: 0.9, ease: [0.65, 0, 0.35, 1] as const };
        return (
          <motion.path
            key={i}
            d={p.d}
            stroke={color}
            fill={p.fill ? color : 'none'}
            className={p.accent ? 'bi-accent' : undefined}
            initial={{ pathLength: 0, opacity: 0, fillOpacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1, fillOpacity: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ pathLength: t, opacity: { delay: t.delay, duration: 0.2 }, fillOpacity: { delay: t.delay + 0.6, duration: 0.5 } }}
          />
        );
      })}
    </svg>
  );
}

export const BRAND_ICON_NAMES = Object.keys(ICONS) as BrandIconName[];

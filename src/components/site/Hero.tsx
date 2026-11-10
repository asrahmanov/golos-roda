'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { BrandIcon } from '@/components/ui/BrandIcon';
import { Countdown } from './Countdown';

const EMBERS = [
  { x: 6, d: 16, delay: 0, drift: 40, s: 3 },
  { x: 14, d: 21, delay: 6, drift: -30, s: 4 },
  { x: 23, d: 18, delay: 11, drift: 25, s: 2 },
  { x: 35, d: 24, delay: 3, drift: 50, s: 3 },
  { x: 47, d: 19, delay: 14, drift: -45, s: 2 },
  { x: 58, d: 23, delay: 8, drift: 30, s: 4 },
  { x: 66, d: 17, delay: 1, drift: -20, s: 3 },
  { x: 74, d: 22, delay: 12, drift: 35, s: 2 },
  { x: 83, d: 20, delay: 5, drift: -40, s: 3 },
  { x: 92, d: 25, delay: 9, drift: 20, s: 4 },
];

export function Hero({
  eyebrow,
  title,
  subtitle,
  festivalDate,
  festivalDateText,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  festivalDate: string;
  festivalDateText: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const words = title.split(' ');

  return (
    <section ref={ref} className="relative isolate overflow-hidden bg-ink-900 text-cream-50">
      <div className="grain pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay" />
      <div className="pointer-events-none absolute -left-40 top-20 h-[32rem] w-[32rem] rounded-full bg-gold-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-[28rem] w-[28rem] rounded-full bg-gold-700/20 blur-[120px]" />

      <svg className="pointer-events-none absolute left-1/2 top-1/2 -z-0 w-[140%] max-w-none -translate-x-1/2 -translate-y-1/2 lg:w-[110%]" viewBox="0 0 400 200" fill="none" aria-hidden>
        <defs>
          <radialGradient id="hero-light">
            <stop offset="0" stopColor="#f3d7ad" />
            <stop offset="0.35" stopColor="#d9a86c" stopOpacity="0.6" />
            <stop offset="1" stopColor="#d9a86c" stopOpacity="0" />
          </radialGradient>
        </defs>
        <motion.path
          id="hero-inf"
          d="M200 100c-30-42-55-66-92-66a66 66 0 0 0 0 132c37 0 62-24 92-66zm0 0c30 42 55 66 92 66a66 66 0 0 0 0-132c-37 0-62 24-92 66z"
          stroke="#d9a86c"
          strokeOpacity="0.09"
          strokeWidth="1.2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 4, ease: 'easeInOut' }}
        />
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5, duration: 1.5 }}>
          <circle r="7" fill="url(#hero-light)">
            <animateMotion dur="14s" repeatCount="indefinite" path="M200 100c-30-42-55-66-92-66a66 66 0 0 0 0 132c37 0 62-24 92-66zm0 0c30 42 55 66 92 66a66 66 0 0 0 0-132c-37 0-62 24-92 66z" />
          </circle>
          <circle r="5" fill="url(#hero-light)">
            <animateMotion dur="14s" begin="-7s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="linear" path="M200 100c-30-42-55-66-92-66a66 66 0 0 0 0 132c37 0 62-24 92-66zm0 0c30 42 55 66 92 66a66 66 0 0 0 0-132c-37 0-62 24-92 66z" />
          </circle>
        </motion.g>
      </svg>

      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {EMBERS.map((e, i) => (
          <span
            key={i}
            className="ember"
            style={{ left: `${e.x}%`, animationDuration: `${e.d}s`, animationDelay: `${e.delay}s`, ['--drift' as string]: `${e.drift}px`, width: e.s, height: e.s }}
          />
        ))}
      </div>

      <div className="container-x relative grid min-h-[calc(100svh-6rem)] items-center gap-10 py-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-20">
        <motion.div style={{ y: textY }} className="relative z-10">
          <motion.p className="eyebrow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {eyebrow}
          </motion.p>
          <h1 className="h-display mt-6 text-[clamp(3.2rem,9vw,7.5rem)]">
            {words.map((w, i) => (
              <span key={i} className="block overflow-hidden pb-2">
                <motion.span
                  className="block"
                  initial={{ y: '110%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 1, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                >
                  {i === words.length - 1 ? <em className="not-italic text-gold-400">{w}</em> : w}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p
            className="mt-6 max-w-xl font-serif text-xl italic leading-relaxed text-cream-100/80 sm:text-2xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.55 }}
          >
            {subtitle}
          </motion.p>
          <motion.div
            className="mt-10 flex flex-col gap-3 sm:flex-row"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.75 }}
          >
            <Link href="/register" data-magnetic className="btn-gold group px-7 py-4 text-[15px]">
              Начать семейное дерево
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/festival" data-magnetic className="btn-ghost px-7 py-4 text-[15px] text-cream-50">
              <BrandIcon name="calendar" draw={false} accent="#e3b77e" className="h-5 w-5 text-gold-400" />
              Фестиваль {festivalDateText}
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 1 }} className="mt-12">
            <Countdown target={festivalDate} />
          </motion.div>
        </motion.div>

        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.94, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.3, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative aspect-[4/3.4] overflow-hidden rounded-[2rem] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)] ring-1 ring-white/10 sm:aspect-[4/3.6] lg:aspect-[4/4.6]">
            <motion.div style={{ y: imgY, scale: imgScale }} className="absolute inset-[-8%]">
              <Image src="/img/sculpture.jpg" alt="Эскиз скульптуры «Связь поколений»: руки старшего и младшего поколений внутри знака бесконечности" fill priority className="object-cover" sizes="(min-width:1024px) 50vw, 100vw" />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" />
            <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 sm:inset-x-7 sm:bottom-7">
              <p className="max-w-xs text-xs leading-relaxed text-cream-100/75 sm:text-sm">
                Символ проекта — руки двух поколений, соединённые в знаке бесконечности.
              </p>
            </div>
          </div>
          <motion.div
            className="absolute -left-4 top-10 hidden rounded-2xl bg-cream-50 p-4 text-ink-900 shadow-2xl sm:block lg:-left-10"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.3, duration: 0.8 }}
          >
            <div className="animate-float">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gold-600">Цель запуска</p>
              <p className="mt-1 font-serif text-3xl font-semibold">100 семей</p>
              <p className="text-xs text-ink-500">и 50+ семейных деревьев</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

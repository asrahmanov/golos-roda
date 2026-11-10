'use client';

import { motion, useInView, useMotionValue, useSpring, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = 'div',
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: 'div' | 'li' | 'section' | 'span';
}) {
  const M = motion[as];
  return (
    <M
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </M>
  );
}

export function Stagger({ children, className, gap = 0.08 }: { children: React.ReactNode; className?: string; gap?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 30, scale: 0.98 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function Counter({ to, duration = 1.8, className }: { to: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: duration * 1000, bounce: 0 });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (inView) mv.set(to);
  }, [inView, to, mv]);
  useEffect(() => spring.on('change', (v) => setVal(Math.round(v))), [spring]);
  return (
    <span ref={ref} className={className}>
      {val.toLocaleString('ru-RU')}
    </span>
  );
}

export function Parallax({ children, offset = 60, className }: { children: React.ReactNode; offset?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }} className="h-full w-full">
        {children}
      </motion.div>
    </div>
  );
}

export function ProgressBar({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-current/10 ${className ?? ''}`}>
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-300"
        initial={{ width: 0 }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      />
    </div>
  );
}

const EASE = [0.22, 1, 0.36, 1] as const;

export function MaskReveal({ children, className, from = 'bottom', delay = 0 }: { children: React.ReactNode; className?: string; from?: 'bottom' | 'left' | 'right'; delay?: number }) {
  const hidden = { bottom: 'inset(100% 0% 0% 0%)', left: 'inset(0% 100% 0% 0%)', right: 'inset(0% 0% 0% 100%)' }[from];
  return (
    <motion.div
      className={className}
      initial={{ clipPath: hidden }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 1.3, delay, ease: EASE }}
    >
      <motion.div
        className="h-full w-full"
        initial={{ scale: 1.25 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 1.8, delay, ease: EASE }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function TitleReveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <span className={`block overflow-hidden pb-[0.12em] ${className ?? ''}`}>
      <motion.span
        className="block"
        initial={{ y: '105%', rotate: 2 }}
        whileInView={{ y: 0, rotate: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 1.1, delay, ease: EASE }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export function DrawLine({ className, vertical = false, delay = 0.2 }: { className?: string; vertical?: boolean; delay?: number }) {
  return (
    <motion.div
      aria-hidden
      className={className}
      style={{ originX: 0, originY: 0 }}
      initial={vertical ? { scaleY: 0 } : { scaleX: 0 }}
      whileInView={vertical ? { scaleY: 1 } : { scaleX: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 1.8, delay, ease: EASE }}
    />
  );
}

export function Ornament({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className ?? ''}`} aria-hidden>
      <motion.span
        className={`h-px w-16 origin-right sm:w-28 ${dark ? 'bg-gold-400/40' : 'bg-gold-500/40'}`}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: EASE }}
      />
      <svg viewBox="0 0 40 20" className="h-5 w-10 text-gold-500" fill="none">
        <motion.path
          d="M20 10c-3-4-5.5-6.5-9-6.5a6.5 6.5 0 0 0 0 13c3.5 0 6-2.5 9-6.5zm0 0c3 4 5.5 6.5 9 6.5a6.5 6.5 0 0 0 0-13c-3.5 0-6 2.5-9 6.5z"
          stroke="currentColor"
          strokeWidth="1.6"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, ease: 'easeInOut' }}
        />
      </svg>
      <motion.span
        className={`h-px w-16 origin-left sm:w-28 ${dark ? 'bg-gold-400/40' : 'bg-gold-500/40'}`}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: EASE }}
      />
    </div>
  );
}

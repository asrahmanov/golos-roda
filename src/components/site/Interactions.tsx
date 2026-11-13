'use client';

import { MotionConfig, motion, useScroll, useSpring } from 'framer-motion';
import { useEffect } from 'react';

function ScrollThread() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-gold-700 via-gold-400 to-gold-200"
      style={{ scaleX }}
    >
      <span className="absolute -right-1 -top-[3px] h-2 w-2 rounded-full bg-gold-300 shadow-[0_0_12px_3px_rgba(220,194,130,0.8)]" />
    </motion.div>
  );
}

export function Interactions({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine) return;
    let magnet: HTMLElement | null = null;

    const onMove = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      const spot = t?.closest<HTMLElement>('.spotlight');
      if (spot) {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty('--mx', `${e.clientX - r.left}px`);
        spot.style.setProperty('--my', `${e.clientY - r.top}px`);
      }
      if (reduce) return;
      const m = t?.closest<HTMLElement>('[data-magnetic]') ?? null;
      if (magnet && magnet !== m) {
        magnet.style.transform = '';
        magnet = null;
      }
      if (m) {
        magnet = m;
        const r = m.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        m.style.transform = `translate(${dx * 6}px, ${dy * 5}px)`;
      }
    };
    const onLeave = () => {
      if (magnet) magnet.style.transform = '';
      magnet = null;
    };
    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <ScrollThread />
      {children}
    </MotionConfig>
  );
}

import { useMemo } from 'react';

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

const BRANCHES = [
  'M500 520 C 470 430, 390 380, 280 350',
  'M500 520 C 530 430, 610 380, 720 350',
  'M500 500 C 492 400, 498 300, 500 170',
  'M488 450 C 430 360, 360 290, 250 250',
  'M512 450 C 570 360, 640 290, 750 250',
  'M470 410 C 440 330, 420 260, 380 190',
  'M530 410 C 560 330, 580 260, 620 190',
  'M340 365 C 300 330, 250 320, 200 330',
  'M660 365 C 700 330, 750 320, 800 330',
  'M420 300 C 390 260, 350 230, 300 200',
  'M580 300 C 610 260, 650 230, 700 200',
];

const ROOTS = [
  'M470 760 C 420 775, 360 780, 290 800',
  'M530 760 C 580 775, 640 780, 710 800',
  'M485 770 C 460 785, 430 795, 400 800',
  'M515 770 C 540 785, 570 795, 600 800',
];

/** Фон дерева: золотое дерево с кроной, нарисованное тонкими линиями — не спорит со схемой. */
export function TreeBackdrop() {
  const leaves = useMemo(() => {
    const r = rng(7);
    const out: { x: number; y: number; rx: number; ry: number; a: number; o: number }[] = [];
    while (out.length < 170) {
      const t = r() * Math.PI * 2;
      const d = Math.sqrt(r());
      const x = 500 + Math.cos(t) * 390 * d;
      const y = 290 + Math.sin(t) * 220 * d;
      if (y > 440) continue;
      out.push({ x, y, rx: 7 + r() * 9, ry: 3 + r() * 4, a: r() * 180, o: 0.35 + d * 0.65 });
    }
    return out;
  }, []);

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1000 800" preserveAspectRatio="xMidYMax meet" aria-hidden>
      <defs>
        <radialGradient id="tb-glow" cx="50%" cy="38%" r="50%">
          <stop offset="0" stopColor="#d5b877" stopOpacity="0.28" />
          <stop offset="1" stopColor="#d5b877" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="tb-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d5b877" />
          <stop offset="1" stopColor="#a08340" />
        </linearGradient>
      </defs>
      <ellipse cx="500" cy="300" rx="470" ry="300" fill="url(#tb-glow)" />
      <g opacity="0.2" stroke="url(#tb-gold)" fill="none" strokeLinecap="round">
        <path d="M466 800 C 476 690, 482 600, 486 500 L 514 500 C 518 600, 524 690, 534 800 Z" fill="url(#tb-gold)" stroke="none" />
        {ROOTS.map((d) => <path key={d} d={d} strokeWidth="5" />)}
        {BRANCHES.map((d, i) => <path key={d} d={d} strokeWidth={i < 3 ? 9 : i < 7 ? 5 : 3} />)}
        <g fill="url(#tb-gold)" stroke="none">
          {leaves.map((l, i) => (
            <ellipse key={i} cx={l.x} cy={l.y} rx={l.rx} ry={l.ry} transform={`rotate(${l.a} ${l.x} ${l.y})`} opacity={l.o} />
          ))}
        </g>
      </g>
    </svg>
  );
}

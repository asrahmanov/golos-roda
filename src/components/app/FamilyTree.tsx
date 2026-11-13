'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Crosshair, Maximize2, Minus, Plus, UserPlus, X, ArrowUpRight, Search } from 'lucide-react';
import { CARD_H, CARD_W, layoutTree, type TreeRelation } from '@/lib/tree-layout';
import { cn, initials, lifeYears } from '@/lib/utils';

export type TreeNode = {
  id: string;
  firstName: string;
  lastName: string | null;
  middleName: string | null;
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN';
  birthDate: string | null;
  deathDate: string | null;
  isLiving: boolean;
  avatar: string | null;
  materials: number;
  occupation: string | null;
};

export function FamilyTree({
  familyId,
  persons,
  relations,
  meId,
  canEdit,
}: {
  familyId: string;
  persons: TreeNode[];
  relations: TreeRelation[];
  meId: string | null;
  canEdit: boolean;
}) {
  const layout = useMemo(() => layoutTree(persons, relations), [persons, relations]);
  const byId = useMemo(() => new Map(persons.map((p) => [p.id, p])), [persons]);
  const wrap = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const downNode = useRef<string | null>(null);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean; pinch?: { d: number; k: number; cx: number; cy: number } } | null>(null);
  const PAD = 60;

  const fit = useCallback(() => {
    const el = wrap.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const k = Math.min(1.1, Math.max(0.25, Math.min(w / (layout.width + PAD * 2), h / (layout.height + PAD * 2))));
    setView({ k, x: (w - layout.width * k) / 2, y: Math.max(PAD * k, (h - layout.height * k) / 2) });
  }, [layout]);

  const focus = useCallback(
    (id: string, k = 1) => {
      const el = wrap.current;
      const p = layout.placed.find((n) => n.id === id);
      if (!el || !p) return;
      setView({ k, x: el.clientWidth / 2 - (p.x + CARD_W / 2) * k, y: el.clientHeight / 2.4 - (p.y + CARD_H / 2) * k });
    },
    [layout],
  );

  useEffect(() => {
    const el = wrap.current;
    const fitK = el ? Math.min(el.clientWidth / (layout.width + PAD * 2), el.clientHeight / (layout.height + PAD * 2)) : 1;
    if (meId && fitK < 0.55) focus(meId, 0.85);
    else fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setView((v) => {
        const k = Math.min(2.2, Math.max(0.2, v.k * Math.exp(-e.deltaY * 0.0015)));
        return { k, x: mx - ((mx - v.x) / v.k) * k, y: my - ((my - v.y) / v.k) * k };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const zoom = (f: number) => {
    const el = wrap.current;
    if (!el) return;
    const mx = el.clientWidth / 2;
    const my = el.clientHeight / 2;
    setView((v) => {
      const k = Math.min(2.2, Math.max(0.2, v.k * f));
      return { k, x: mx - ((mx - v.x) / v.k) * k, y: my - ((my - v.y) / v.k) * k };
    });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    downNode.current = ((e.target as HTMLElement).closest('[data-node]') as HTMLElement | null)?.dataset.node ?? null;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const rect = wrap.current!.getBoundingClientRect();
      drag.current = {
        x: 0, y: 0, vx: view.x, vy: view.y, moved: true,
        pinch: { d: Math.hypot(a.x - b.x, a.y - b.y), k: view.k, cx: (a.x + b.x) / 2 - rect.left, cy: (a.y + b.y) / 2 - rect.top },
      };
    } else {
      drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false };
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const dr = drag.current;
    if (dr.pinch && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const k = Math.min(2.2, Math.max(0.2, (dr.pinch.k * d) / dr.pinch.d));
      const { cx, cy } = dr.pinch;
      setView({ k, x: cx - ((cx - dr.vx) / dr.pinch.k) * k, y: cy - ((cy - dr.vy) / dr.pinch.k) * k });
      return;
    }
    const dx = e.clientX - dr.x;
    const dy = e.clientY - dr.y;
    if (Math.abs(dx) + Math.abs(dy) > 5) dr.moved = true;
    if (dr.moved) setView((v) => ({ ...v, x: dr.vx + dx, y: dr.vy + dy }));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    const dr = drag.current;
    if (pointers.current.size === 0) {
      if (dr && !dr.moved) setSelected(downNode.current);
      drag.current = null;
    } else if (pointers.current.size === 1) {
      const [p] = [...pointers.current.values()];
      drag.current = { x: p.x, y: p.y, vx: view.x, vy: view.y, moved: true };
    }
  };

  const matches = query.trim()
    ? persons.filter((p) => `${p.firstName} ${p.lastName ?? ''} ${p.middleName ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6)
    : [];
  const sel = selected ? byId.get(selected) : null;
  const relOf = (id: string) => ({
    parents: relations.filter((r) => r.type === 'PARENT' && r.toId === id).length,
  });

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[1.75rem] bg-[radial-gradient(circle_at_1px_1px,rgba(17,33,26,0.09)_1px,transparent_0)] [background-size:22px_22px] bg-cream-100 ring-1 ring-ink-900/8">
      <div
        ref={wrap}
        className="absolute inset-0 cursor-grab touch-none select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="absolute left-0 top-0 origin-top-left will-change-transform"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`, width: layout.width, height: layout.height }}
        >
          <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={layout.width} height={layout.height}>
            {layout.edges.map((e, i) => (
              <motion.path
                key={i + e.d}
                d={e.d}
                fill="none"
                stroke={e.kind === 'spouse' ? '#c2a057' : '#7d8d84'}
                strokeWidth={e.kind === 'spouse' ? 2.5 : 1.6}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 + Math.min(i, 20) * 0.03 }}
              />
            ))}
          </svg>
          {layout.placed.map((n, i) => {
            const p = byId.get(n.id)!;
            const me = n.id === meId;
            return (
              <motion.div
                key={n.id}
                data-node={n.id}
                className={cn(
                  'absolute flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_8px_30px_-12px_rgba(11,23,18,0.35)] ring-1 transition-shadow hover:shadow-[0_16px_40px_-12px_rgba(11,23,18,0.45)]',
                  selected === n.id ? 'ring-2 ring-gold-500' : me ? 'ring-2 ring-gold-400/70' : 'ring-ink-900/8',
                  !p.isLiving && 'bg-cream-50',
                )}
                style={{ left: n.x, top: n.y, width: CARD_W, height: CARD_H }}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(i, 30) * 0.025, type: 'spring', stiffness: 200, damping: 20 }}
              >
                <span
                  className={cn(
                    'relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full font-serif text-lg font-semibold',
                    p.gender === 'FEMALE' ? 'bg-rose-500/12 text-rose-500' : p.gender === 'MALE' ? 'bg-sage-500/15 text-sage-500' : 'bg-cream-200 text-ink-500',
                    !p.isLiving && 'grayscale',
                  )}
                >
                  {p.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.avatar} alt="" className="h-full w-full object-cover" draggable={false} />
                  ) : (
                    initials(`${p.firstName} ${p.lastName ?? ''}`)
                  )}
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-[14px] font-bold text-ink-900">{p.firstName}</span>
                  <span className="block truncate text-[12px] text-ink-600">{p.lastName}</span>
                  <span className="mt-1 block truncate text-[11px] text-ink-400">{lifeYears(p) || ' '}</span>
                </span>
                {me && <span className="absolute -top-2 right-3 rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-bold text-ink-950">это я</span>}
                {p.materials > 0 && (
                  <span className="absolute -bottom-2 right-3 rounded-full bg-ink-900 px-2 py-0.5 text-[10px] font-bold text-gold-300">{p.materials}</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Поиск */}
      <div className="absolute left-3 top-3 z-10 w-[min(18rem,calc(100%-1.5rem))] sm:left-4 sm:top-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти в дереве"
            className="w-full rounded-full border border-ink-900/10 bg-white/95 py-2.5 pl-10 pr-4 text-sm shadow-lg outline-none backdrop-blur focus:border-gold-500"
          />
        </div>
        {matches.length > 0 && (
          <div className="mt-2 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-ink-900/8">
            {matches.map((m) => (
              <button
                key={m.id}
                className="block w-full px-4 py-2.5 text-left text-sm hover:bg-cream-100"
                onClick={() => {
                  focus(m.id, 1);
                  setSelected(m.id);
                  setQuery('');
                }}
              >
                {m.firstName} {m.lastName} <span className="text-ink-400">{lifeYears(m)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Управление */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        {[
          { I: Plus, f: () => zoom(1.25), l: 'Приблизить' },
          { I: Minus, f: () => zoom(0.8), l: 'Отдалить' },
          { I: Maximize2, f: fit, l: 'Показать всё дерево' },
          ...(meId ? [{ I: Crosshair, f: () => focus(meId, 1), l: 'Найти меня' }] : []),
        ].map((b) => (
          <button key={b.l} onClick={b.f} title={b.l} aria-label={b.l} className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink-700 shadow-lg ring-1 ring-ink-900/8 transition hover:bg-ink-900 hover:text-gold-300">
            <b.I className="h-4 w-4" />
          </button>
        ))}
      </div>
      <div className="pointer-events-none absolute bottom-4 left-4 z-10 hidden rounded-full bg-white/80 px-3 py-1.5 text-[11px] text-ink-500 backdrop-blur sm:block">
        Перетаскивайте дерево, масштаб — колёсиком или жестом
      </div>

      {/* Панель выбранного */}
      <AnimatePresence>
        {sel && (
          <motion.aside
            key={sel.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="absolute inset-x-3 bottom-3 z-20 rounded-3xl bg-white p-5 shadow-2xl ring-1 ring-ink-900/10 sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4 sm:w-80"
          >
            <button onClick={() => setSelected(null)} className="absolute right-3 top-3 rounded-full p-2 text-ink-400 hover:bg-cream-100" aria-label="Закрыть">
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-cream-200 font-serif text-xl font-semibold text-ink-500">
                {sel.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sel.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials(`${sel.firstName} ${sel.lastName ?? ''}`)
                )}
              </span>
              <div className="min-w-0 pr-6">
                <p className="font-serif text-xl font-semibold leading-tight">
                  {sel.firstName} {sel.middleName}
                </p>
                <p className="text-ink-600">{sel.lastName}</p>
                <p className="mt-0.5 text-xs text-ink-400">{[lifeYears(sel), sel.occupation].filter(Boolean).join(' · ')}</p>
              </div>
            </div>
            <Link href={`/app/family/${familyId}/person/${sel.id}`} className="btn-dark mt-5 w-full">
              Открыть карточку <ArrowUpRight className="h-4 w-4" />
            </Link>
            {canEdit && (
              <div className="mt-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink-500">
                  <UserPlus className="h-3.5 w-3.5" /> Добавить родственника
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { r: 'parent', l: 'Родителя', hide: relOf(sel.id).parents >= 2 },
                    { r: 'child', l: 'Ребёнка' },
                    { r: 'spouse', l: 'Супруга(у)' },
                    { r: 'sibling', l: 'Брата / сестру', hide: relOf(sel.id).parents === 0 },
                  ]
                    .filter((b) => !b.hide)
                    .map((b) => (
                      <Link
                        key={b.r}
                        href={`/app/family/${familyId}/person/new?relativeId=${sel.id}&relation=${b.r}`}
                        className="rounded-xl border border-ink-900/10 px-3 py-2.5 text-center text-sm font-medium transition hover:border-gold-500 hover:bg-gold-500/10"
                      >
                        {b.l}
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

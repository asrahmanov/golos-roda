'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Crosshair, Info, Maximize2, Minus, Plus, X, ArrowUpRight, Search } from 'lucide-react';
import { CARD_H, CARD_W, layoutTree, type TreeRelation } from '@/lib/tree-layout';
import { cn, initials, lifeYears } from '@/lib/utils';
import { TreeBackdrop } from './TreeBackdrop';

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
  focusId,
}: {
  familyId: string;
  persons: TreeNode[];
  relations: TreeRelation[];
  meId: string | null;
  canEdit: boolean;
  focusId?: string | null;
}) {
  const layout = useMemo(() => layoutTree(persons, relations, meId), [persons, relations, meId]);
  const byId = useMemo(() => new Map(persons.map((p) => [p.id, p])), [persons]);
  const wrap = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [selected, setSelected] = useState<string | null>(null);
  const [hints, setHints] = useState(false);
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
    if (focusId && byId.has(focusId)) {
      focus(focusId, 1);
      setSelected(focusId);
    } else if (meId && fitK < 0.55) focus(meId, 0.85);
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
    if ((e.target as HTMLElement).closest('[data-action]')) return;
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
      if (dr && !dr.moved) {
        const id = downNode.current;
        setSelected(id);
        setHints(false);
        if (id && view.k < 0.7) focus(id, 0.9);
      }
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
  const parentsOf = (id: string) => relations.filter((r) => r.type === 'PARENT' && r.toId === id).map((r) => byId.get(r.fromId)).filter(Boolean) as TreeNode[];
  const addHref = (id: string, relation: string, gender?: 'MALE' | 'FEMALE') =>
    `/app/family/${familyId}/person/new?relativeId=${id}&relation=${relation}${gender ? `&gender=${gender}` : ''}&back=tree`;
  const actionsFor = (p: TreeNode): AddAction[] => {
    const ps = parentsOf(p.id);
    const opposite = (g?: string) => (g === 'MALE' ? 'FEMALE' : g === 'FEMALE' ? 'MALE' : undefined);
    const list: AddAction[] = [{ pos: 'bottom', label: 'Добавить ребёнка', href: addHref(p.id, 'child') }];
    if (ps.length < 2) list.push({ pos: 'top', label: 'Добавить родителя', href: addHref(p.id, 'parent', ps.length === 1 ? opposite(ps[0].gender) : undefined) });
    const married = relations.some((r) => r.type === 'SPOUSE' && (r.fromId === p.id || r.toId === p.id));
    if (!married) {
      list.push(
        p.gender === 'FEMALE'
          ? { pos: 'left', label: 'Добавить супруга', href: addHref(p.id, 'spouse', 'MALE') }
          : { pos: 'right', label: p.gender === 'MALE' ? 'Добавить супругу' : 'Добавить супруга(у)', href: addHref(p.id, 'spouse', opposite(p.gender)) },
      );
    }
    if (ps.length === 0) list.push({ pos: 'corner', label: 'Добавить брата или сестру', note: 'если родители неизвестны', href: addHref(p.id, 'sibling') });
    return list;
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[1.75rem] bg-cream-100 ring-1 ring-ink-900/8">
      <TreeBackdrop />
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
                stroke={e.kind === 'spouse' ? '#c2a057' : e.kind === 'sibling' ? '#a08340' : '#7d8d84'}
                strokeWidth={e.kind === 'spouse' ? 2.5 : 1.6}
                strokeDasharray={e.kind === 'sibling' ? '5 6' : undefined}
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
            const isSel = selected === n.id;
            return (
              <motion.div
                key={n.id}
                className={cn('absolute', isSel ? 'z-30' : 'z-0')}
                style={{ left: n.x, top: n.y, width: CARD_W, height: CARD_H }}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: isSel ? 1.12 : 1 }}
                transition={{ delay: isSel ? 0 : Math.min(i, 30) * 0.025, type: 'spring', stiffness: 260, damping: 22 }}
              >
                <div
                  data-node={n.id}
                  className={cn(
                    'relative flex h-full w-full cursor-pointer items-center gap-3 rounded-2xl bg-white p-3 ring-1 transition-shadow',
                    isSel
                      ? 'shadow-[0_24px_60px_-18px_rgba(11,23,18,0.55)] ring-2 ring-gold-500'
                      : cn('shadow-[0_8px_30px_-12px_rgba(11,23,18,0.35)] hover:shadow-[0_16px_40px_-12px_rgba(11,23,18,0.45)]', me ? 'ring-2 ring-gold-400/70' : 'ring-ink-900/8'),
                    !p.isLiving && 'bg-cream-50',
                  )}
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
                  {me && <span className="absolute -top-2 left-3 rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-bold text-ink-950">это я</span>}
                  {p.materials > 0 && (
                    <span className="absolute -bottom-2 right-3 rounded-full bg-ink-900 px-2 py-0.5 text-[10px] font-bold text-gold-300">{p.materials}</span>
                  )}
                </div>
                {isSel && canEdit && <AddActions actions={actionsFor(p)} hints={hints} onToggleHints={() => setHints((h) => !h)} />}
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
        Нажмите на карточку, чтобы добавить родственников. Дерево можно перетаскивать и масштабировать
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
            className="absolute inset-x-3 bottom-3 z-40 rounded-3xl bg-white p-3 shadow-2xl sm:p-5 ring-1 ring-ink-900/10 sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4 sm:w-80"
          >
            <button onClick={() => setSelected(null)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-ink-400 hover:bg-cream-100 sm:right-3 sm:top-3 sm:translate-y-0" aria-label="Закрыть">
              <X className="h-4 w-4" />
            </button>
            <div className="hidden items-center gap-4 sm:flex">
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
            <Link href={`/app/family/${familyId}/person/${sel.id}`} className="btn-gold w-[calc(100%-2.5rem)] whitespace-nowrap sm:mt-5 sm:w-full">
              <span className="truncate sm:hidden">{sel.firstName} {sel.lastName} ·</span> Открыть карточку <ArrowUpRight className="h-4 w-4 shrink-0" />
            </Link>
            {canEdit && (
              <p className="mt-4 hidden items-start gap-2 text-xs leading-relaxed text-ink-500 sm:flex">
                <Plus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-600" />
                Чтобы добавить родственника, нажмите «+» вокруг карточки. Значок «i» покажет подсказки.
              </p>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

type AddAction = { pos: 'top' | 'bottom' | 'left' | 'right' | 'corner'; label: string; note?: string; href: string };

const SPOT: Record<AddAction['pos'] | 'info', string> = {
  top: 'left-1/2 top-0 -translate-x-1/2 -translate-y-[calc(100%+10px)]',
  bottom: 'left-1/2 bottom-0 -translate-x-1/2 translate-y-[calc(100%+10px)]',
  left: 'left-0 top-1/2 -translate-x-[calc(100%+10px)] -translate-y-1/2',
  right: 'right-0 top-1/2 translate-x-[calc(100%+10px)] -translate-y-1/2',
  corner: 'right-0 top-0 translate-x-[calc(100%+2px)] -translate-y-[calc(100%+2px)]',
  info: 'left-0 top-0 -translate-x-[calc(100%+4px)] -translate-y-[calc(100%+4px)]',
};
const LABEL: Record<AddAction['pos'], string> = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2 text-center',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2 text-center',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2 text-right',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
  corner: 'left-full bottom-1/2 ml-2',
};

function AddActions({ actions, hints, onToggleHints }: { actions: AddAction[]; hints: boolean; onToggleHints: () => void }) {
  return (
    <>
      {actions.map((a, i) => (
        <div key={a.pos} className={cn('absolute', SPOT[a.pos])}>
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.05 + i * 0.04, type: 'spring', stiffness: 380, damping: 20 }}>
            <Link
              data-action
              href={a.href}
              title={a.label}
              aria-label={a.label}
              className="grid h-9 w-9 place-items-center rounded-full bg-gold-500 text-ink-950 shadow-[0_8px_20px_-6px_rgba(123,100,47,0.7)] ring-4 ring-cream-100 transition hover:scale-110 hover:bg-gold-400"
            >
              <Plus className="h-4 w-4" strokeWidth={2.6} />
            </Link>
          </motion.div>
          <AnimatePresence>
            {hints && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn('pointer-events-none absolute whitespace-nowrap rounded-xl bg-ink-900 px-3 py-1.5 text-[12px] font-semibold leading-tight text-cream-50 shadow-xl', LABEL[a.pos])}
              >
                {a.label}
                {a.note && <span className="block text-[11px] font-normal text-cream-100/60">{a.note}</span>}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      ))}
      <div className={cn('absolute', SPOT.info)}>
        <motion.button
          data-action
          type="button"
          onClick={onToggleHints}
          aria-pressed={hints}
          aria-label="Подсказки"
          title="Подсказки"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 380, damping: 20 }}
          className={cn(
            'grid h-9 w-9 place-items-center rounded-full ring-4 ring-cream-100 transition',
            hints ? 'bg-ink-900 text-gold-300' : 'bg-white text-ink-700 shadow-lg hover:text-gold-700',
          )}
        >
          <Info className="h-4 w-4" />
        </motion.button>
      </div>
    </>
  );
}

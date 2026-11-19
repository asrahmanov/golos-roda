export type Gender = 'MALE' | 'FEMALE' | 'UNKNOWN';
export type TreePerson = { id: string; gender?: Gender; birthDate?: string | null };
export type TreeRelation = { id?: string; type: 'PARENT' | 'SPOUSE' | 'SIBLING'; fromId: string; toId: string };

export const CARD_W = 188;
export const CARD_H = 92;
const GAP_X = 44;
const GAP_COUPLE = 64;
const GAP_Y = 124;
const TOP = 36;
const LANE = 12;

export type Placed = { id: string; x: number; y: number; gen: number };
export type Edge = { d: string; kind: 'child' | 'spouse' | 'sibling' };
export type EdgeLabel = { x: number; y: number; text: string; kind: Edge['kind'] };

const CHILD_LABEL: Record<Gender, string> = { MALE: 'сын', FEMALE: 'дочь', UNKNOWN: 'ребёнок' };
const SIBLING_LABEL: Record<Gender, string> = { MALE: 'брат', FEMALE: 'сестра', UNKNOWN: 'брат / сестра' };

const SEX_RANK: Record<Gender, number> = { FEMALE: 0, UNKNOWN: 1, MALE: 2 };
const COUPLE_RANK: Record<Gender, number> = { MALE: 0, UNKNOWN: 1, FEMALE: 2 };
const yearOf = (s?: string | null) => {
  const m = s?.match(/\d{4}/);
  return m ? Number(m[0]) : Infinity;
};

/**
 * Раскладка родового дерева:
 * - поколения строго на одном уровне;
 * - в паре мужчина слева, женщина справа; при двух браках человек стоит между супругами;
 * - дети: дочери слева, сыновья справа — супруги детей уходят наружу ветки;
 * - дети каждого брака — отдельной группой под своей парой;
 * - предки мужа строятся над ним влево, предки жены — вправо; при нехватке места ветки раздвигаются;
 * - порядок ячеек в рядах подбирается так, чтобы линии родства не пересекались.
 */
export function layoutTree(persons: TreePerson[], relations: TreeRelation[], rootId?: string | null) {
  const ids = persons.map((p) => p.id);
  const idSet = new Set(ids);
  const order = new Map(ids.map((id, i) => [id, i]));
  const sex = new Map(persons.map((p) => [p.id, p.gender ?? 'UNKNOWN']));
  const born = new Map(persons.map((p) => [p.id, yearOf(p.birthDate)]));
  const parents = new Map<string, string[]>();
  const children = new Map<string, string[]>();
  const spouses = new Map<string, string[]>();
  const sibs = new Map<string, string[]>();
  for (const id of ids) {
    parents.set(id, []);
    children.set(id, []);
    spouses.set(id, []);
    sibs.set(id, []);
  }
  for (const r of relations) {
    if (!idSet.has(r.fromId) || !idSet.has(r.toId) || r.fromId === r.toId) continue;
    if (r.type === 'PARENT') {
      children.get(r.fromId)!.push(r.toId);
      parents.get(r.toId)!.push(r.fromId);
    } else {
      const m = r.type === 'SPOUSE' ? spouses : sibs;
      m.get(r.fromId)!.push(r.toId);
      m.get(r.toId)!.push(r.fromId);
    }
  }

  // 1. Поколения
  const gen = new Map<string, number>();
  const byFewestParents = [...ids].sort((a, b) => parents.get(a)!.length - parents.get(b)!.length);
  for (const start of byFewestParents) {
    if (gen.has(start)) continue;
    const comp: string[] = [];
    gen.set(start, 0);
    const queue = [start];
    while (queue.length) {
      const cur = queue.shift()!;
      comp.push(cur);
      const g = gen.get(cur)!;
      for (const p of parents.get(cur)!) if (!gen.has(p)) { gen.set(p, g - 1); queue.push(p); }
      for (const c of children.get(cur)!) if (!gen.has(c)) { gen.set(c, g + 1); queue.push(c); }
      for (const s of [...spouses.get(cur)!, ...sibs.get(cur)!]) if (!gen.has(s)) { gen.set(s, g); queue.push(s); }
    }
    const min = Math.min(...comp.map((c) => gen.get(c)!));
    for (const c of comp) gen.set(c, gen.get(c)! - min);
  }

  // 2. Семейные ячейки: супруги и со-родители одного поколения
  const partner = new Map<string, Set<string>>();
  for (const id of ids) partner.set(id, new Set(spouses.get(id)!.filter((s) => gen.get(s) === gen.get(id))));
  for (const id of ids) {
    const ps = parents.get(id)!;
    if (ps.length === 2 && gen.get(ps[0]) === gen.get(ps[1])) {
      partner.get(ps[0])!.add(ps[1]);
      partner.get(ps[1])!.add(ps[0]);
    }
  }
  const unitOf = new Map<string, number>();
  const units: { members: string[]; gen: number }[] = [];
  for (const id of ids) {
    if (unitOf.has(id)) continue;
    const members: string[] = [];
    const stack = [id];
    unitOf.set(id, units.length);
    while (stack.length) {
      const cur = stack.pop()!;
      members.push(cur);
      for (const s of partner.get(cur)!) if (!unitOf.has(s)) { unitOf.set(s, units.length); stack.push(s); }
    }
    units.push({ members: orderMembers(members), gen: gen.get(id)! });
  }
  function orderMembers(ms: string[]) {
    ms.sort((a, b) => order.get(a)! - order.get(b)!);
    if (ms.length === 2) return ms.sort((a, b) => COUPLE_RANK[sex.get(a)!] - COUPLE_RANK[sex.get(b)!]);
    if (ms.length > 2) {
      const hub = [...ms].sort((a, b) => partner.get(b)!.size - partner.get(a)!.size)[0];
      const rest = ms.filter((m) => m !== hub);
      if (rest.length === 2 && partner.get(hub)!.size === 2) {
        return sex.get(hub) === 'FEMALE' ? [rest[0], hub, rest[1]] : [rest[1], hub, rest[0]];
      }
      if (sex.get(hub) === 'MALE') return [hub, ...rest];
      if (sex.get(hub) === 'FEMALE') return [...rest, hub];
      const half = Math.ceil(rest.length / 2);
      return [...rest.slice(0, half), hub, ...rest.slice(half)];
    }
    return ms;
  }

  const unitW = (u: number) => units[u].members.length * CARD_W + (units[u].members.length - 1) * GAP_COUPLE;
  /** Смещение центра участника относительно центра ячейки */
  const memberShift = (u: number, id: string) => units[u].members.indexOf(id) * (CARD_W + GAP_COUPLE) + CARD_W / 2 - unitW(u) / 2;

  const upUnits = (u: number) => {
    const res: { u: number; via: string }[] = [];
    for (const m of units[u].members) {
      const ps = parents.get(m)!;
      if (!ps.length) continue;
      const pu = unitOf.get(ps[0])!;
      if (!res.some((r) => r.u === pu)) res.push({ u: pu, via: m });
    }
    return res;
  };
  /** Ребёнок, вступивший в брак с человеком из другой семьи, встаёт с краю — ближе к семье супруга */
  const junctionSide = (kid: string, fromUnit: number) => {
    const ku = unitOf.get(kid)!;
    const ms = units[ku].members;
    if (ms.length < 2) return 0;
    const otherFamily = ms.some((m) => m !== kid && parents.get(m)!.some((p) => unitOf.get(p) !== fromUnit));
    if (!otherFamily) return 0;
    return ms.indexOf(kid) === 0 ? 1 : -1;
  };
  /** Для ячейки из нескольких браков: дети левой пары идут левее детей правой */
  const pairRank = (kid: string, u: number) => {
    const ms = units[u].members;
    if (ms.length < 3) return 0;
    const idx = parents.get(kid)!.map((p) => ms.indexOf(p)).filter((i) => i >= 0);
    return idx.reduce((s, i) => s + i, 0) / Math.max(1, idx.length);
  };
  const downUnits = (u: number) => {
    const childSort = (a: string, b: string) =>
      pairRank(a, u) - pairRank(b, u) ||
      junctionSide(a, u) - junctionSide(b, u) ||
      SEX_RANK[sex.get(a)!] - SEX_RANK[sex.get(b)!] ||
      born.get(a)! - born.get(b)! ||
      order.get(a)! - order.get(b)!;
    const kids = [...new Set(units[u].members.flatMap((m) => children.get(m)!))].sort(childSort);
    const res: number[] = [];
    for (const k of kids) {
      const cu = unitOf.get(k)!;
      if (cu !== u && !res.includes(cu)) res.push(cu);
    }
    return res;
  };
  const sideUnits = (u: number) => {
    const res: { u: number; side: -1 | 1 }[] = [];
    const ms = units[u].members;
    ms.forEach((m, i) => {
      for (const s of sibs.get(m)!) {
        const su = unitOf.get(s)!;
        if (su === u || res.some((r) => r.u === su)) continue;
        const side = ms.length > 1 ? (i === ms.length - 1 ? 1 : -1) : sex.get(m) === 'MALE' ? -1 : 1;
        res.push({ u: su, side });
      }
    });
    return res;
  };

  // Оценка ширины веток (для начальной раскладки)
  const descMemo = new Map<number, number>();
  const descW = (u: number, seen = new Set<number>()): number => {
    if (descMemo.has(u)) return descMemo.get(u)!;
    if (seen.has(u)) return unitW(u);
    seen.add(u);
    const ds = downUnits(u);
    const w = Math.max(unitW(u), ds.reduce((s, d) => s + descW(d, seen), 0) + GAP_X * Math.max(0, ds.length - 1));
    descMemo.set(u, w);
    return w;
  };
  const ancMemo = new Map<number, number>();
  const ancW = (u: number, seen = new Set<number>()): number => {
    if (ancMemo.has(u)) return ancMemo.get(u)!;
    if (seen.has(u)) return unitW(u);
    seen.add(u);
    const us = upUnits(u);
    const w = Math.max(descW(u), us.reduce((s, d) => s + ancW(d.u, seen), 0) + GAP_X * Math.max(0, us.length - 1));
    ancMemo.set(u, w);
    return w;
  };

  // 3. Начальная раскладка обходом от корня: задаёт порядок ячеек в каждом поколении
  const rx = new Map<number, number>();
  const visitOrder = new Map<number, number>();
  const unitIds = units.map((_, i) => i);
  const roots = [
    ...(rootId && unitOf.has(rootId) ? [unitOf.get(rootId)!] : []),
    ...[...unitIds].sort((a, b) => units[a].gen - units[b].gen || descW(b) - descW(a)),
  ];
  let compRight = -Infinity;
  for (const root of roots) {
    if (rx.has(root)) continue;
    const comp: number[] = [];
    const queue: number[] = [];
    const put = (u: number, cx: number) => {
      if (rx.has(u)) return;
      rx.set(u, cx);
      visitOrder.set(u, visitOrder.size);
      comp.push(u);
      queue.push(u);
    };
    put(root, 0);
    while (queue.length) {
      const u = queue.shift()!;
      const cx = rx.get(u)!;

      const ds = downUnits(u);
      if (ds.length) {
        const ws = ds.map((d) => descW(d));
        const total = ws.reduce((s, w) => s + w, 0) + GAP_X * (ds.length - 1);
        let cur = cx - total / 2;
        const slots = ws.map((w) => {
          const c = cur + w / 2;
          cur += w + GAP_X;
          return c;
        });
        const anchorIdx = ds.findIndex((d) => rx.has(d));
        const shift = anchorIdx >= 0 ? rx.get(ds[anchorIdx])! - slots[anchorIdx] : 0;
        ds.forEach((d, i) => put(d, slots[i] + shift));
      }

      const us = upUnits(u);
      if (us.length === 1) {
        put(us[0].u, cx + memberShift(u, us[0].via));
      } else if (us.length > 1) {
        const ws = us.map((x) => ancW(x.u));
        const total = ws.reduce((s, w) => s + w, 0) + GAP_X * (us.length - 1);
        let cur = cx - total / 2;
        us.forEach((x, i) => {
          put(x.u, cur + ws[i] / 2);
          cur += ws[i] + GAP_X;
        });
      }

      let left = cx - unitW(u) / 2;
      let right = cx + unitW(u) / 2;
      for (const s of sideUnits(u)) {
        const w = descW(s.u);
        if (s.side < 0) {
          put(s.u, left - GAP_X - w / 2);
          left -= GAP_X + w;
        } else {
          put(s.u, right + GAP_X + w / 2);
          right += GAP_X + w;
        }
      }
    }
    const minLeft = Math.min(...comp.map((u) => rx.get(u)! - ancW(u) / 2));
    const shift = compRight === -Infinity ? 0 : compRight + GAP_X * 3 - minLeft;
    for (const u of comp) rx.set(u, rx.get(u)! + shift);
    compRight = Math.max(...comp.map((u) => rx.get(u)! + ancW(u) / 2));
  }

  const maxGen = Math.max(0, ...units.map((u) => u.gen));
  const rows: number[][] = Array.from({ length: maxGen + 1 }, () => []);
  unitIds.forEach((u) => rows[units[u].gen].push(u));
  for (const row of rows) row.sort((a, b) => rx.get(a)! - rx.get(b)! || visitOrder.get(a)! - visitOrder.get(b)!);

  // 4. Точная расстановка: порядок фиксирован, наложения разрешаются раздвиганием (PAV)
  const ux = new Map<number, number>(); // центр ячейки
  for (const u of unitIds) ux.set(u, rx.get(u)!);
  const center = (id: string) => ux.get(unitOf.get(id)!)! + memberShift(unitOf.get(id)!, id);

  const placeRow = (row: number[], desired: (u: number) => { c: number; w: number }) => {
    type Block = { sw: number; swy: number; n: number };
    const blocks: Block[] = [];
    let off = 0;
    const offs: number[] = [];
    row.forEach((u) => {
      offs.push(off);
      const d = desired(u);
      blocks.push({ sw: d.w, swy: d.w * (d.c - unitW(u) / 2 - off), n: 1 });
      off += unitW(u) + GAP_X;
      while (blocks.length > 1) {
        const b = blocks[blocks.length - 1];
        const a = blocks[blocks.length - 2];
        if (a.swy / a.sw <= b.swy / b.sw) break;
        blocks.splice(blocks.length - 2, 2, { sw: a.sw + b.sw, swy: a.swy + b.swy, n: a.n + b.n });
      }
    });
    let i = 0;
    for (const b of blocks) {
      const y = b.swy / b.sw;
      for (let k = 0; k < b.n; k++, i++) ux.set(row[i], y + offs[i] + unitW(row[i]) / 2);
    }
  };

  /** Из двух родителей, стоящих не рядом (третий брак и т.п.), линия к детям идёт от матери — того, у кого меньше браков */
  const motherOf = (a: string, b: string) =>
    partner.get(a)!.size !== partner.get(b)!.size
      ? partner.get(a)!.size < partner.get(b)!.size ? a : b
      : sex.get(a) === 'FEMALE' ? a : b;
  const parentsAdjacent = (a: string, b: string) => {
    const ua = unitOf.get(a)!;
    if (ua !== unitOf.get(b)) return true;
    const ms = units[ua].members;
    return Math.abs(ms.indexOf(a) - ms.indexOf(b)) === 1;
  };
  const anchorX = (ps: string[]) => {
    if (ps.length < 2) return center(ps[0]);
    const [a, b] = ps;
    return parentsAdjacent(a, b) ? (center(a) + center(b)) / 2 : center(motherOf(a, b));
  };

  const fromParents = (u: number) => {
    const wants: number[] = [];
    for (const m of units[u].members) {
      const ps = parents.get(m)!.slice(0, 2);
      if (!ps.length) continue;
      wants.push(anchorX(ps) - memberShift(u, m));
    }
    return wants.length ? { c: wants.reduce((s, v) => s + v, 0) / wants.length, w: wants.length } : { c: ux.get(u)!, w: 0.05 };
  };
  const fromChildren = (u: number) => {
    const kids = [...new Set(units[u].members.flatMap((m) => children.get(m)!))].filter((k) => unitOf.get(k) !== u);
    if (!kids.length) return { c: ux.get(u)!, w: 0.05 };
    const lo = Math.min(...kids.map(center));
    const hi = Math.max(...kids.map(center));
    return { c: (lo + hi) / 2, w: 1 };
  };

  const placeAll = (iters: number) => {
    for (let iter = 0; iter < iters; iter++) {
      for (let g = maxGen - 1; g >= 0; g--) placeRow(rows[g], fromChildren);
      for (let g = 1; g <= maxGen; g++) placeRow(rows[g], fromParents);
    }
  };

  // 5. Порядок в рядах: убираем пересечения линий «родители → дети» (барицентры + перестановки соседей)
  const slot = new Map<string, number>();
  const indexRow = (row: number[]) => {
    let i = 0;
    for (const u of row) for (const m of units[u].members) slot.set(m, i++);
  };
  const rowEdges: { kid: string; ps: string[] }[][] = rows.map(() => []);
  for (const id of ids) {
    const ps = parents.get(id)!.slice(0, 2).filter((p) => gen.get(p) === gen.get(id)! - 1);
    if (ps.length) rowEdges[gen.get(id)!].push({ kid: id, ps });
  }
  const crossAt = (g: number) => {
    if (g < 1 || g > maxGen) return 0;
    const es = rowEdges[g].map((e) => [e.ps.reduce((s, p) => s + slot.get(p)!, 0) / e.ps.length, slot.get(e.kid)!]);
    let c = 0;
    for (let i = 0; i < es.length; i++)
      for (let j = i + 1; j < es.length; j++) if ((es[i][0] - es[j][0]) * (es[i][1] - es[j][1]) < 0) c++;
    return c;
  };
  const totalCross = () => {
    rows.forEach(indexRow);
    let c = 0;
    for (let g = 1; g <= maxGen; g++) c += crossAt(g);
    return c;
  };
  const reorder = (g: number, key: (u: number) => { c: number; w: number }) => {
    const cur = new Map(rows[g].map((u, i) => [u, i]));
    const k = new Map(rows[g].map((u) => {
      const d = key(u);
      return [u, d.w > 0.05 ? d.c : ux.get(u)!];
    }));
    rows[g].sort((a, b) => k.get(a)! - k.get(b)! || cur.get(a)! - cur.get(b)!);
  };
  const improveRow = (g: number) => {
    const row = rows[g];
    for (let pass = 0; pass < 6; pass++) {
      let improved = false;
      for (let i = 0; i + 1 < row.length; i++) {
        indexRow(row);
        const before = crossAt(g) + crossAt(g + 1);
        [row[i], row[i + 1]] = [row[i + 1], row[i]];
        indexRow(row);
        if (crossAt(g) + crossAt(g + 1) < before) improved = true;
        else [row[i], row[i + 1]] = [row[i + 1], row[i]];
      }
      if (!improved) break;
    }
    indexRow(row);
  };

  /** Пересортировка ряда по соседнему ряду; ячейки без связей с ним остаются на своих местах */
  const baryResort = (r: number, dir: 'down' | 'up') => {
    if (r < 0 || r > maxGen) return;
    const row = rows[r];
    const key = (u: number) => {
      const vals: number[] = [];
      for (const m of units[u].members) {
        if (dir === 'down') {
          const ps = parents.get(m)!.slice(0, 2).filter((p) => gen.get(p) === r - 1);
          if (ps.length) vals.push(ps.reduce((s, p) => s + slot.get(p)!, 0) / ps.length);
        } else {
          for (const k of children.get(m)!) if (gen.get(k) === r + 1) vals.push(slot.get(k)!);
        }
      }
      return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
    };
    const keyed = row.map((u, i) => ({ u, i, k: key(u) })).filter((x) => x.k !== null) as { u: number; i: number; k: number }[];
    const sorted = [...keyed].sort((a, b) => a.k - b.k || a.i - b.i);
    keyed.forEach((x, j) => (row[x.i] = sorted[j].u));
    indexRow(row);
  };
  const localCross = (g: number) => crossAt(g - 1) + crossAt(g) + crossAt(g + 1) + crossAt(g + 2);
  /** Перенос ячейки на любое место ряда с подстройкой соседних рядов */
  const sift = (g: number) => {
    for (const u of [...rows[g]]) {
      const span = [g - 1, g, g + 1].filter((r) => r >= 0 && r <= maxGen);
      const snap = () => span.map((r) => [...rows[r]]);
      const restore = (s: number[][]) => span.forEach((r, i) => { rows[r] = [...s[i]]; indexRow(rows[r]); });
      const start = snap();
      let bestC = localCross(g);
      let bestS = start;
      const without = rows[g].filter((x) => x !== u);
      for (let p = 0; p <= without.length; p++) {
        restore(start);
        rows[g] = [...without.slice(0, p), u, ...without.slice(p)];
        indexRow(rows[g]);
        baryResort(g + 1, 'down');
        baryResort(g - 1, 'up');
        const c = localCross(g);
        if (c < bestC) {
          bestC = c;
          bestS = snap();
        }
      }
      restore(bestS);
    }
  };

  placeAll(6);
  let best = { c: totalCross(), rows: rows.map((r) => [...r]), ux: new Map(ux) };
  const small = ids.length <= 400;
  for (let it = 0; it < 8 && best.c > 0; it++) {
    for (let g = 1; g <= maxGen; g++) {
      reorder(g, fromParents);
      placeRow(rows[g], fromParents);
    }
    for (let g = maxGen - 1; g >= 0; g--) {
      reorder(g, fromChildren);
      placeRow(rows[g], fromChildren);
    }
    if (small) {
      rows.forEach(indexRow);
      for (let g = 0; g <= maxGen; g++) improveRow(g);
      if (ids.length <= 200) for (let g = 0; g <= maxGen; g++) sift(g);
    }
    placeAll(3);
    const c = totalCross();
    if (c < best.c) best = { c, rows: rows.map((r) => [...r]), ux: new Map(ux) };
  }
  best.rows.forEach((r, g) => (rows[g] = r));
  for (const [u, x] of best.ux) ux.set(u, x);
  placeAll(10);

  const xs = new Map<string, number>();
  for (const id of ids) xs.set(id, center(id) - CARD_W / 2);
  const minX = xs.size ? Math.min(...xs.values()) : 0;
  const placed: Placed[] = ids.map((id) => ({
    id,
    x: xs.get(id)! - minX,
    y: TOP + gen.get(id)! * (CARD_H + GAP_Y),
    gen: gen.get(id)!,
  }));
  const pos = new Map(placed.map((p) => [p.id, p]));
  const adjacent = (a: Placed, b: Placed) => a.y === b.y && Math.abs(Math.abs(b.x - a.x) - CARD_W - GAP_COUPLE) < 1;

  // 6. Линии и подписи
  const edges: Edge[] = [];
  const labels: EdgeLabel[] = [];
  const drawn = new Set<string>();
  for (const id of ids) {
    for (const s of spouses.get(id)!) {
      const key = [id, s].sort().join('|');
      if (drawn.has(key)) continue;
      drawn.add(key);
      const a = pos.get(id)!;
      const b = pos.get(s)!;
      const [l, r] = a.x < b.x ? [a, b] : [b, a];
      if (adjacent(l, r)) {
        const y = l.y + CARD_H / 2;
        edges.push({ kind: 'spouse', d: `M ${l.x + CARD_W} ${y} H ${r.x}` });
        labels.push({ kind: 'spouse', x: l.x + CARD_W + GAP_COUPLE / 2, y: y - 12, text: 'супруги' });
      } else {
        const top = Math.min(l.y, r.y) - 30;
        const x1 = l.x + CARD_W / 2;
        const x2 = r.x + CARD_W / 2;
        edges.push({ kind: 'spouse', d: `M ${x1} ${l.y} C ${x1} ${top}, ${x2} ${top}, ${x2} ${r.y}` });
        labels.push({ kind: 'spouse', x: (x1 + x2) / 2, y: (l.y + r.y) / 8 + (top * 3) / 4, text: 'супруги' });
      }
    }
  }

  const groups = new Map<string, string[]>();
  for (const id of ids) {
    const ps = parents.get(id)!.slice(0, 2);
    if (!ps.length) continue;
    const key = [...ps].sort().join('|');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(id);
  }
  type Bus = { ax: number; ay: number; kids: Placed[]; lo: number; hi: number; top: number; lane: number };
  const buses: Bus[] = [];
  for (const [key, kids] of groups) {
    const pids = key.split('|');
    const ps = pids.map((p) => pos.get(p)!);
    let ax: number;
    let ay: number;
    if (ps.length >= 2) {
      const [l, r] = ps[0].x < ps[1].x ? [ps[0], ps[1]] : [ps[1], ps[0]];
      if (adjacent(l, r)) {
        ax = l.x + CARD_W + GAP_COUPLE / 2;
        ay = l.y + CARD_H / 2;
      } else if (l.y === r.y && !parentsAdjacent(pids[0], pids[1])) {
        const m = pos.get(motherOf(pids[0], pids[1]))!;
        ax = m.x + CARD_W / 2;
        ay = m.y + CARD_H;
      } else {
        ax = (l.x + r.x + CARD_W) / 2;
        ay = Math.max(l.y, r.y) + CARD_H;
      }
    } else {
      ax = ps[0].x + CARD_W / 2;
      ay = ps[0].y + CARD_H;
    }
    const kidPos = kids.map((k) => pos.get(k)!);
    const kx = kidPos.map((k) => k.x + CARD_W / 2);
    buses.push({ ax, ay, kids: kidPos, lo: Math.min(ax, ...kx), hi: Math.max(ax, ...kx), top: Math.min(...kidPos.map((k) => k.y)), lane: 0 });
  }
  // Шины соседних семей, которые перекрываются по горизонтали, разводим по разным уровням, чтобы они не сливались
  const laneCount = new Map<number, number>();
  for (const top of new Set(buses.map((b) => b.top))) {
    const row = buses.filter((b) => b.top === top).sort((a, b) => a.lo - b.lo);
    const ends: number[] = [];
    for (const b of row) {
      let lane = ends.findIndex((e) => e < b.lo - 18);
      if (lane < 0) lane = ends.push(0) - 1;
      ends[lane] = b.hi;
      b.lane = lane;
    }
    laneCount.set(top, ends.length);
  }
  for (const b of buses) {
    const n = laneCount.get(b.top)!;
    const busY = b.top - GAP_Y / 2 + (b.lane - (n - 1) / 2) * LANE;
    let d = `M ${b.ax} ${b.ay} V ${busY}`;
    if (b.hi - b.lo > 0.5) d += ` M ${b.lo} ${busY} H ${b.hi}`;
    for (const k of b.kids) {
      d += ` M ${k.x + CARD_W / 2} ${busY} V ${k.y}`;
      labels.push({ kind: 'child', x: k.x + CARD_W / 2, y: k.y - 22, text: CHILD_LABEL[sex.get(k.id)!] });
    }
    edges.push({ kind: 'child', d });
  }

  // Братья и сёстры с неизвестными родителями — скобка над карточками
  const seenSib = new Set<string>();
  for (const id of ids) {
    if (seenSib.has(id) || !sibs.get(id)!.length) continue;
    const group: string[] = [];
    const stack = [id];
    seenSib.add(id);
    while (stack.length) {
      const cur = stack.pop()!;
      group.push(cur);
      for (const s of sibs.get(cur)!) if (!seenSib.has(s)) { seenSib.add(s); stack.push(s); }
    }
    const gp = group.map((g) => pos.get(g)!);
    const yTop = Math.min(...gp.map((p) => p.y)) - 34;
    const gx = gp.map((p) => p.x + CARD_W / 2);
    let d = `M ${Math.min(...gx)} ${yTop} H ${Math.max(...gx)}`;
    for (const p of gp) {
      d += ` M ${p.x + CARD_W / 2} ${yTop} V ${p.y}`;
      labels.push({ kind: 'sibling', x: p.x + CARD_W / 2, y: p.y - 14, text: SIBLING_LABEL[sex.get(p.id)!] });
    }
    edges.push({ kind: 'sibling', d });
  }

  const width = Math.max(CARD_W, ...placed.map((p) => p.x + CARD_W));
  const height = Math.max(CARD_H, ...placed.map((p) => p.y + CARD_H));
  return { placed, edges, labels, width, height };
}

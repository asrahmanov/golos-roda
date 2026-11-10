export type TreePerson = { id: string };
export type TreeRelation = { type: 'PARENT' | 'SPOUSE'; fromId: string; toId: string };

export const CARD_W = 188;
export const CARD_H = 92;
const GAP_X = 36;
const GAP_COUPLE = 22;
const GAP_Y = 110;

export type Placed = { id: string; x: number; y: number; gen: number };
export type Edge = { d: string; kind: 'child' | 'spouse' };

export function layoutTree(persons: TreePerson[], relations: TreeRelation[]) {
  const ids = persons.map((p) => p.id);
  const idSet = new Set(ids);
  const parents = new Map<string, string[]>();
  const children = new Map<string, string[]>();
  const spouses = new Map<string, string[]>();
  for (const id of ids) {
    parents.set(id, []);
    children.set(id, []);
    spouses.set(id, []);
  }
  for (const r of relations) {
    if (!idSet.has(r.fromId) || !idSet.has(r.toId)) continue;
    if (r.type === 'PARENT') {
      children.get(r.fromId)!.push(r.toId);
      parents.get(r.toId)!.push(r.fromId);
    } else {
      spouses.get(r.fromId)!.push(r.toId);
      spouses.get(r.toId)!.push(r.fromId);
    }
  }

  // 1. Поколения
  const gen = new Map<string, number>();
  const components: string[][] = [];
  const order = [...ids].sort((a, b) => parents.get(a)!.length - parents.get(b)!.length);
  for (const start of order) {
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
      for (const s of spouses.get(cur)!) if (!gen.has(s)) { gen.set(s, g); queue.push(s); }
    }
    const min = Math.min(...comp.map((c) => gen.get(c)!));
    for (const c of comp) gen.set(c, gen.get(c)! - min);
    components.push(comp);
  }

  // 2. Пары/группы внутри поколения: супруги и со-родители
  const unitOf = new Map<string, number>();
  const units: { members: string[]; gen: number }[] = [];
  const partnerLinks = new Map<string, Set<string>>();
  for (const id of ids) partnerLinks.set(id, new Set(spouses.get(id)!.filter((s) => gen.get(s) === gen.get(id))));
  for (const id of ids) {
    const ps = parents.get(id)!;
    if (ps.length === 2 && gen.get(ps[0]) === gen.get(ps[1])) {
      partnerLinks.get(ps[0])!.add(ps[1]);
      partnerLinks.get(ps[1])!.add(ps[0]);
    }
  }
  for (const comp of components) {
    for (const id of comp) {
      if (unitOf.has(id)) continue;
      const members: string[] = [];
      const stack = [id];
      unitOf.set(id, units.length);
      while (stack.length) {
        const cur = stack.pop()!;
        members.push(cur);
        for (const s of partnerLinks.get(cur)!) if (!unitOf.has(s)) { unitOf.set(s, units.length); stack.push(s); }
      }
      // цепочка: человек с наибольшим числом партнёров — в середине
      if (members.length > 2) {
        members.sort((a, b) => partnerLinks.get(a)!.size - partnerLinks.get(b)!.size);
        const hub = members.pop()!;
        const half = Math.ceil(members.length / 2);
        members.splice(half, 0, hub);
      }
      units.push({ members, gen: gen.get(id)! });
    }
  }

  const maxGen = Math.max(0, ...units.map((u) => u.gen));
  const rows: number[][] = Array.from({ length: maxGen + 1 }, () => []);
  units.forEach((u, i) => rows[u.gen].push(i));

  const unitWidth = (u: number) => units[u].members.length * CARD_W + (units[u].members.length - 1) * GAP_COUPLE;
  const x = new Map<string, number>();
  const unitX = new Map<number, number>();

  const setUnitX = (u: number, left: number) => {
    unitX.set(u, left);
    units[u].members.forEach((m, i) => x.set(m, left + i * (CARD_W + GAP_COUPLE)));
  };
  const center = (id: string) => (x.get(id) ?? 0) + CARD_W / 2;

  // начальная расстановка
  for (const row of rows) {
    let cursor = 0;
    for (const u of row) {
      setUnitX(u, cursor);
      cursor += unitWidth(u) + GAP_X;
    }
  }

  const placeRow = (row: number[], desired: (u: number) => number | null) => {
    const withD = row.map((u, idx) => ({ u, d: desired(u), idx }));
    withD.sort((a, b) => {
      const da = a.d ?? (unitX.get(a.u) ?? 0) + unitWidth(a.u) / 2;
      const dbb = b.d ?? (unitX.get(b.u) ?? 0) + unitWidth(b.u) / 2;
      return da - dbb || a.idx - b.idx;
    });
    row.splice(0, row.length, ...withD.map((w) => w.u));
    // слева направо с учётом желаемого центра
    let prevRight = -Infinity;
    const lefts: number[] = [];
    for (const w of withD) {
      const want = (w.d ?? (unitX.get(w.u) ?? 0) + unitWidth(w.u) / 2) - unitWidth(w.u) / 2;
      const left = Math.max(want, prevRight + GAP_X);
      lefts.push(left);
      prevRight = left + unitWidth(w.u);
    }
    // сдвигаем назад, чтобы сбалансировать смещение вправо
    for (let i = withD.length - 2; i >= 0; i--) {
      const w = withD[i];
      const want = (w.d ?? lefts[i] + unitWidth(w.u) / 2) - unitWidth(w.u) / 2;
      const maxLeft = lefts[i + 1] - GAP_X - unitWidth(w.u);
      if (lefts[i] < want) lefts[i] = Math.min(want, maxLeft);
    }
    withD.forEach((w, i) => setUnitX(w.u, lefts[i]));
  };

  const parentCenter = (u: number) => {
    const ps = units[u].members.flatMap((m) => parents.get(m)!);
    if (!ps.length) return null;
    return ps.reduce((s, p) => s + center(p), 0) / ps.length;
  };
  const childCenter = (u: number) => {
    const cs = [...new Set(units[u].members.flatMap((m) => children.get(m)!))];
    if (!cs.length) return null;
    return cs.reduce((s, c) => s + center(c), 0) / cs.length;
  };

  for (let iter = 0; iter < 6; iter++) {
    for (let g = 1; g <= maxGen; g++) placeRow(rows[g], parentCenter);
    for (let g = maxGen - 1; g >= 0; g--) placeRow(rows[g], childCenter);
  }
  for (let g = 1; g <= maxGen; g++) placeRow(rows[g], parentCenter);

  const minX = x.size ? Math.min(...x.values()) : 0;
  const placed: Placed[] = ids.map((id) => ({
    id,
    x: (x.get(id) ?? 0) - minX,
    y: gen.get(id)! * (CARD_H + GAP_Y),
    gen: gen.get(id)!,
  }));
  const pos = new Map(placed.map((p) => [p.id, p]));

  // 3. Линии
  const edges: Edge[] = [];
  const drawnSpouse = new Set<string>();
  for (const id of ids) {
    for (const s of spouses.get(id)!) {
      const key = [id, s].sort().join('|');
      if (drawnSpouse.has(key)) continue;
      drawnSpouse.add(key);
      const a = pos.get(id)!;
      const b = pos.get(s)!;
      const [l, r] = a.x < b.x ? [a, b] : [b, a];
      const y = l.y + CARD_H / 2;
      if (l.gen === r.gen && unitOf.get(l.id) === unitOf.get(r.id) && Math.abs(r.x - l.x - CARD_W - GAP_COUPLE) < 1) {
        edges.push({ kind: 'spouse', d: `M ${l.x + CARD_W} ${y} H ${r.x}` });
      } else {
        const ly = l.y;
        const ry = r.y;
        const top = Math.min(ly, ry) - 26;
        edges.push({ kind: 'spouse', d: `M ${l.x + CARD_W / 2} ${ly} C ${l.x + CARD_W / 2} ${top}, ${r.x + CARD_W / 2} ${top}, ${r.x + CARD_W / 2} ${ry}` });
      }
    }
  }

  const groups = new Map<string, string[]>();
  for (const id of ids) {
    const ps = parents.get(id)!;
    if (!ps.length) continue;
    const key = [...ps].sort().join('|');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(id);
  }
  for (const [key, kids] of groups) {
    const ps = key.split('|').map((p) => pos.get(p)!);
    let ax: number;
    let ay: number;
    if (ps.length >= 2) {
      const [l, r] = ps[0].x < ps[1].x ? [ps[0], ps[1]] : [ps[1], ps[0]];
      const adjacent = l.y === r.y && Math.abs(r.x - l.x - CARD_W - GAP_COUPLE) < 1;
      ax = adjacent ? l.x + CARD_W + GAP_COUPLE / 2 : (center(l.id) + center(r.id)) / 2;
      ay = adjacent ? l.y + CARD_H / 2 : Math.max(l.y, r.y) + CARD_H;
    } else {
      ax = ps[0].x + CARD_W / 2;
      ay = ps[0].y + CARD_H;
    }
    const kidPos = kids.map((k) => pos.get(k)!);
    const childTop = Math.min(...kidPos.map((k) => k.y));
    const busY = childTop - GAP_Y / 2;
    const xs = kidPos.map((k) => k.x + CARD_W / 2);
    const minBx = Math.min(ax, ...xs);
    const maxBx = Math.max(ax, ...xs);
    let d = `M ${ax} ${ay} V ${busY}`;
    if (maxBx - minBx > 0.5) d += ` M ${minBx} ${busY} H ${maxBx}`;
    for (const k of kidPos) d += ` M ${k.x + CARD_W / 2} ${busY} V ${k.y}`;
    edges.push({ kind: 'child', d });
  }

  const width = Math.max(CARD_W, ...placed.map((p) => p.x + CARD_W));
  const height = Math.max(CARD_H, ...placed.map((p) => p.y + CARD_H));
  return { placed, edges, width, height };
}

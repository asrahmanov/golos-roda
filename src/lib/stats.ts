import 'server-only';
import { db } from './db';

/**
 * «Созданное дерево» — семейное пространство, в котором есть минимум 3 родственника
 * и хотя бы одна родственная связь. «Семья-участник» — пространство, где добавлен
 * хотя бы один родственник; тестовые пустые пространства не учитываются.
 */
export const TREE_MIN_PERSONS = 3;

export async function getPublicStats() {
  const families = await db.family.findMany({
    select: { id: true, _count: { select: { persons: true, relations: true } } },
  });
  const participating = families.filter((f) => f._count.persons > 0).length;
  const trees = families.filter((f) => f._count.persons >= TREE_MIN_PERSONS && f._count.relations > 0).length;
  const [persons, stories] = await Promise.all([
    db.person.count(),
    db.material.count({ where: { type: { in: ['MEMORY', 'AUDIO', 'VIDEO'] } } }),
  ]);
  return { families: participating, trees, persons, stories };
}

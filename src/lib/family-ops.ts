import 'server-only';
import { db } from './db';
import { logActivity } from './family';
import { optStr } from './utils';

export async function validPersonIds(familyId: string, ids: string[]) {
  if (!ids.length) return [];
  const rows = await db.person.findMany({ where: { familyId, id: { in: ids.slice(0, 50) } }, select: { id: true } });
  return rows.map((r) => r.id);
}

export async function completeTaskIfAny(fd: FormData, familyId: string, userId: string, materialId: string) {
  const taskId = optStr(fd.get('taskId'));
  if (!taskId) return;
  const task = await db.task.findFirst({ where: { id: taskId, isPublished: true } });
  if (!task) return;
  const exists = await db.taskCompletion.findUnique({ where: { taskId_familyId: { taskId, familyId } } });
  if (exists) return;
  await db.taskCompletion.create({ data: { taskId, familyId, userId, materialId } });
  await logActivity(familyId, userId, 'task.complete', `выполнил(а) задание «${task.title}»`, `/app/family/${familyId}/tasks`);
}

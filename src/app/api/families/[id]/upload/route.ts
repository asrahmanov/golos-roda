import { NextResponse } from 'next/server';
import type { MaterialType, Visibility } from '@prisma/client';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canEdit, getMembership, logActivity, personShortName } from '@/lib/family';
import { completeTaskIfAny, validPersonIds } from '@/lib/family-ops';
import { deleteStoredFile, fileKind, saveUpload } from '@/lib/storage';
import { optStr, str } from '@/lib/utils';

export const runtime = 'nodejs';
export const maxDuration = 300;

const VIS: Visibility[] = ['FAMILY', 'EDITORS', 'PRIVATE'];

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: familyId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Войдите в аккаунт' }, { status: 401 });
  const m = await getMembership(familyId, user.id);
  if (!m || !canEdit(m.role)) return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });

  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Не удалось прочитать файл' }, { status: 400 });
  }
  const file = fd.get('file');
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: 'Выберите файл' }, { status: 400 });

  try {
    if (fd.get('mode') === 'avatar') {
      const personId = str(fd.get('personId'));
      const person = await db.person.findFirst({ where: { id: personId, familyId } });
      if (!person) return NextResponse.json({ error: 'Родственник не найден' }, { status: 404 });
      const stored = await saveUpload(file, { familyId, userId: user.id, imageOnly: true });
      const old = person.avatarId;
      await db.person.update({ where: { id: personId }, data: { avatarId: stored.id } });
      if (old) await deleteStoredFile(old);
      await logActivity(familyId, user.id, 'person.avatar', `обновил(а) фото: ${personShortName(person)}`, `/app/family/${familyId}/person/${personId}`);
      return NextResponse.json({ ok: true, fileId: stored.id });
    }

    const used = await db.storedFile.aggregate({ where: { familyId }, _sum: { size: true } });
    if ((used._sum.size ?? 0) + file.size > 5 * 1024 * 1024 * 1024) {
      return NextResponse.json({ error: 'Достигнут лимит хранилища семьи (5 ГБ)' }, { status: 400 });
    }

    const kind = fileKind(file.type);
    const stored = await saveUpload(file, { familyId, userId: user.id });
    const requested = str(fd.get('type')) as MaterialType;
    const type: MaterialType =
      kind === 'image' ? (requested === 'DOCUMENT' ? 'DOCUMENT' : 'PHOTO') : kind === 'audio' ? 'AUDIO' : kind === 'video' ? 'VIDEO' : 'DOCUMENT';
    const vis = fd.get('visibility') as Visibility;
    const personIds = await validPersonIds(familyId, fd.getAll('personIds').map(String));
    const title = str(fd.get('title'), 200) || file.name.replace(/\.[^.]+$/, '').slice(0, 200) || 'Без названия';
    const material = await db.material.create({
      data: {
        familyId,
        type,
        title,
        body: optStr(fd.get('body'), 50000),
        dateText: optStr(fd.get('dateText'), 60),
        place: optStr(fd.get('place'), 200),
        visibility: VIS.includes(vis) ? vis : 'FAMILY',
        fileId: stored.id,
        authorId: user.id,
        persons: { create: personIds.map((personId) => ({ personId })) },
      },
    });
    await completeTaskIfAny(fd, familyId, user.id, material.id);
    const verb = { PHOTO: 'фотографию', DOCUMENT: 'документ', AUDIO: 'аудиозапись', VIDEO: 'видео' } as Record<string, string>;
    await logActivity(familyId, user.id, 'material.create', `загрузил(а) ${verb[type] ?? 'материал'} «${title}»`, `/app/family/${familyId}/archive/${material.id}`);
    return NextResponse.json({ ok: true, materialId: material.id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Ошибка загрузки' }, { status: 400 });
  }
}

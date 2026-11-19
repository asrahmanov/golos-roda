import fs from 'node:fs';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { MAX_ARCHIVE, sweepUploads, uploadPath } from '@/lib/import-upload';

export const runtime = 'nodejs';
export const maxDuration = 300;

const MAX_CHUNK = 64 * 1024 * 1024;

/** Часть архива: тело запроса дописывается в конец временного файла. offset защищает от повторов и пропусков. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Войдите в аккаунт' }, { status: 401 });
  const url = new URL(req.url);
  let file: string;
  try {
    file = uploadPath(user.id, url.searchParams.get('id') ?? '');
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  const offset = Number(url.searchParams.get('offset'));
  if (offset === 0) {
    void sweepUploads();
    await fs.promises.rm(file, { force: true });
  }
  const size = (await fs.promises.stat(file).catch(() => null))?.size ?? 0;
  if (offset !== size) return NextResponse.json({ error: 'Загрузка нарушилась, начните заново', size }, { status: 409 });

  const buf = Buffer.from(await req.arrayBuffer());
  if (buf.length > MAX_CHUNK) return NextResponse.json({ error: 'Слишком большая часть файла' }, { status: 413 });
  if (size + buf.length > MAX_ARCHIVE) {
    await fs.promises.rm(file, { force: true });
    return NextResponse.json({ error: 'Архив слишком большой (больше 6 ГБ)' }, { status: 413 });
  }
  await fs.promises.appendFile(file, buf);
  return NextResponse.json({ ok: true, size: size + buf.length });
}

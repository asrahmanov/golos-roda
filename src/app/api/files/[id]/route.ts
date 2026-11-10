import fs from 'node:fs';
import { Readable } from 'node:stream';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canEdit, getMembership } from '@/lib/family';
import { resolveStoragePath } from '@/lib/storage';

export const runtime = 'nodejs';

async function allowed(fileId: string) {
  const f = await db.storedFile.findUnique({
    where: { id: fileId },
    include: { materials: { select: { visibility: true, authorId: true } } },
  });
  if (!f) return null;
  if (f.isPublic) return { f, cache: 'public, max-age=86400' };
  const user = await getCurrentUser();
  if (!user) return null;
  if (!f.familyId) return user.role === 'ADMIN' ? { f, cache: 'private, max-age=600' } : null;
  const m = await getMembership(f.familyId, user.id);
  if (!m) {
    if (user.role === 'ADMIN' && (await db.publicStory.count({ where: { imageId: f.id } }))) return { f, cache: 'private, no-store' };
    return null;
  }
  for (const mat of f.materials) {
    if (mat.visibility === 'PRIVATE' && mat.authorId !== user.id) return null;
    if (mat.visibility === 'EDITORS' && !canEdit(m.role) && mat.authorId !== user.id) return null;
  }
  return { f, cache: 'private, max-age=600' };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await allowed(id);
  if (!res) return new Response('Not found', { status: 404 });
  const { f, cache } = res;
  const url = new URL(req.url);
  const useThumb = url.searchParams.has('thumb') && f.thumbPath;
  const rel = useThumb ? f.thumbPath! : f.path;
  let full: string;
  try {
    full = resolveStoragePath(rel);
  } catch {
    return new Response('Not found', { status: 404 });
  }
  let stat: fs.Stats;
  try {
    stat = await fs.promises.stat(full);
  } catch {
    return new Response('Not found', { status: 404 });
  }
  const mime = useThumb ? 'image/webp' : f.mime;
  const headers: Record<string, string> = {
    'Content-Type': mime,
    'Cache-Control': cache,
    'Accept-Ranges': 'bytes',
    'X-Content-Type-Options': 'nosniff',
  };
  if (url.searchParams.has('download')) {
    headers['Content-Disposition'] = `attachment; filename*=UTF-8''${encodeURIComponent(f.originalName)}`;
  } else if (!mime.startsWith('image/') && !mime.startsWith('audio/') && !mime.startsWith('video/') && mime !== 'application/pdf') {
    headers['Content-Disposition'] = `attachment; filename*=UTF-8''${encodeURIComponent(f.originalName)}`;
  }

  const range = req.headers.get('range');
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    if (m) {
      const start = m[1] ? parseInt(m[1], 10) : 0;
      const end = m[2] ? Math.min(parseInt(m[2], 10), stat.size - 1) : stat.size - 1;
      if (start <= end && start < stat.size) {
        const stream = fs.createReadStream(full, { start, end });
        return new Response(Readable.toWeb(stream) as ReadableStream, {
          status: 206,
          headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': String(end - start + 1) },
        });
      }
      return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${stat.size}` } });
    }
  }
  const stream = fs.createReadStream(full);
  return new Response(Readable.toWeb(stream) as ReadableStream, { headers: { ...headers, 'Content-Length': String(stat.size) } });
}

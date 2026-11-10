import 'server-only';
import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { db } from './db';

export const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR || './storage');

export const LIMITS = {
  image: 20 * 1024 * 1024,
  document: 25 * 1024 * 1024,
  audio: 60 * 1024 * 1024,
  video: 200 * 1024 * 1024,
};

const IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif'];
const DOCUMENT = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/tiff',
];
const AUDIO = ['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm', 'audio/aac'];
const VIDEO = ['video/mp4', 'video/quicktime', 'video/webm'];

export function fileKind(mime: string): keyof typeof LIMITS | null {
  if (IMAGE.includes(mime)) return 'image';
  if (DOCUMENT.includes(mime)) return 'document';
  if (AUDIO.includes(mime)) return 'audio';
  if (VIDEO.includes(mime)) return 'video';
  return null;
}

export const ACCEPT_ATTR = [...IMAGE, ...DOCUMENT, ...AUDIO, ...VIDEO].join(',');

function extFor(name: string, mime: string) {
  const fromName = path.extname(name).toLowerCase().replace(/[^.a-z0-9]/g, '');
  if (fromName && fromName.length <= 6) return fromName;
  return '.' + (mime.split('/')[1] || 'bin').replace(/[^a-z0-9]/g, '');
}

export async function saveUpload(
  file: File,
  opts: { familyId?: string | null; userId?: string | null; isPublic?: boolean; imageOnly?: boolean },
) {
  const mime = file.type || 'application/octet-stream';
  const kind = fileKind(mime);
  if (!kind) throw new Error('Этот формат файла не поддерживается');
  if (opts.imageOnly && kind !== 'image') throw new Error('Нужно изображение (JPG, PNG, WEBP)');
  if (file.size > LIMITS[kind]) {
    throw new Error(`Файл слишком большой. Максимум ${Math.round(LIMITS[kind] / 1024 / 1024)} МБ`);
  }

  const sub = opts.familyId ? `f/${opts.familyId}` : 'site';
  const dir = path.join(STORAGE_DIR, sub);
  await fs.mkdir(dir, { recursive: true });
  const id = crypto.randomBytes(16).toString('hex');
  const buf = Buffer.from(await file.arrayBuffer());

  let rel: string;
  let thumbRel: string | null = null;
  let width: number | undefined;
  let height: number | undefined;
  let storedMime = mime;
  let size = buf.length;

  if (kind === 'image' && mime !== 'image/gif') {
    const img = sharp(buf, { failOn: 'none' }).rotate();
    const main = await img
      .clone()
      .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 86, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
    rel = `${sub}/${id}.jpg`;
    await fs.writeFile(path.join(STORAGE_DIR, rel), main.data);
    width = main.info.width;
    height = main.info.height;
    size = main.data.length;
    storedMime = 'image/jpeg';
    const thumb = await img
      .clone()
      .resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();
    thumbRel = `${sub}/${id}_t.webp`;
    await fs.writeFile(path.join(STORAGE_DIR, thumbRel), thumb);
  } else {
    rel = `${sub}/${id}${extFor(file.name, mime)}`;
    await fs.writeFile(path.join(STORAGE_DIR, rel), buf);
  }

  return db.storedFile.create({
    data: {
      path: rel,
      thumbPath: thumbRel,
      originalName: file.name.slice(0, 200) || 'file',
      mime: storedMime,
      size,
      width,
      height,
      isPublic: !!opts.isPublic,
      familyId: opts.familyId ?? null,
      uploadedById: opts.userId ?? null,
    },
  });
}

export async function deleteStoredFile(id: string) {
  const f = await db.storedFile.findUnique({ where: { id } });
  if (!f) return;
  await db.storedFile.delete({ where: { id } }).catch(() => null);
  for (const p of [f.path, f.thumbPath]) {
    if (p) await fs.rm(path.join(STORAGE_DIR, p), { force: true });
  }
}

export async function deleteFamilyFiles(familyId: string) {
  await fs.rm(path.join(STORAGE_DIR, 'f', familyId), { recursive: true, force: true });
}

export function fileUrl(id: string | null | undefined, thumb = false) {
  if (!id) return null;
  return `/api/files/${id}${thumb ? '?thumb=1' : ''}`;
}

export function resolveStoragePath(rel: string) {
  const full = path.resolve(STORAGE_DIR, rel);
  if (!full.startsWith(STORAGE_DIR + path.sep)) throw new Error('bad path');
  return full;
}

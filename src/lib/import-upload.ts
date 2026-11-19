import 'server-only';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const MAX_ARCHIVE = 6 * 1024 * 1024 * 1024;

/** Временный файл загружаемого архива; привязан к пользователю, чтобы чужой id нельзя было подставить */
export function uploadPath(userId: string, uploadId: string) {
  if (!/^[a-f0-9]{16,64}$/.test(uploadId) || !/^[a-z0-9]+$/i.test(userId)) throw new Error('Неверный идентификатор загрузки');
  return path.join(os.tmpdir(), `golos-import-${userId}-${uploadId}`);
}

/** Удаляет брошенные загрузки старше суток */
export async function sweepUploads() {
  const dir = os.tmpdir();
  const names = await fs.promises.readdir(dir).catch(() => [] as string[]);
  const cutoff = Date.now() - 24 * 3600 * 1000;
  for (const n of names) {
    if (!n.startsWith('golos-import-')) continue;
    const full = path.join(dir, n);
    const st = await fs.promises.stat(full).catch(() => null);
    if (st && st.mtimeMs < cutoff) await fs.promises.rm(full, { force: true });
  }
}

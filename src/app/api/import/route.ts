import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { NextResponse } from 'next/server';
import yauzl from 'yauzl';
import { getCurrentUser } from '@/lib/auth';
import { canEdit, getMembership } from '@/lib/family';
import { importFamily, normalizeImport } from '@/lib/family-import';

export const runtime = 'nodejs';
export const maxDuration = 600;

const MAX_ARCHIVE = 6 * 1024 * 1024 * 1024;
const MAX_JSON = 30 * 1024 * 1024;
const MAX_FILE = 200 * 1024 * 1024;

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

function openZip(file: string) {
  return new Promise<yauzl.ZipFile>((res, rej) => yauzl.open(file, { lazyEntries: true, autoClose: false }, (e, z) => (e || !z ? rej(e) : res(z))));
}
function listEntries(zip: yauzl.ZipFile) {
  return new Promise<Map<string, yauzl.Entry>>((res, rej) => {
    const map = new Map<string, yauzl.Entry>();
    zip.on('entry', (e: yauzl.Entry) => {
      if (!e.fileName.endsWith('/')) map.set(e.fileName.replace(/^\.?\//, ''), e);
      zip.readEntry();
    });
    zip.once('end', () => res(map));
    zip.once('error', rej);
    zip.readEntry();
  });
}
function readEntry(zip: yauzl.ZipFile, entry: yauzl.Entry, max: number) {
  if (entry.uncompressedSize > max) return Promise.resolve(null);
  return new Promise<Buffer | null>((res, rej) =>
    zip.openReadStream(entry, (e, stream) => {
      if (e || !stream) return rej(e);
      const chunks: Buffer[] = [];
      let size = 0;
      stream.on('data', (c: Buffer) => {
        size += c.length;
        if (size > max) stream.destroy(new Error('too big'));
        else chunks.push(c);
      });
      stream.once('end', () => res(Buffer.concat(chunks)));
      stream.once('error', rej);
    }),
  );
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail('Войдите в аккаунт', 401);
  const url = new URL(req.url);
  const target = url.searchParams.get('target') || 'new';
  if (target !== 'new') {
    const m = await getMembership(target, user.id);
    if (!m || !canEdit(m.role)) return fail('Недостаточно прав для этой семьи', 403);
  }
  if (!req.body) return fail('Выберите файл');
  const fileName = decodeURIComponent(req.headers.get('x-file-name') || 'archive');

  const tmp = path.join(os.tmpdir(), `import-${crypto.randomBytes(8).toString('hex')}`);
  let size = 0;
  try {
    const limit = new Transform({
      transform(chunk: Buffer, _enc, cb) {
        size += chunk.length;
        cb(size > MAX_ARCHIVE ? new Error('Архив слишком большой (больше 6 ГБ)') : null, chunk);
      },
    });
    await pipeline(Readable.fromWeb(req.body as import('node:stream/web').ReadableStream), limit, fs.createWriteStream(tmp));
  } catch (e) {
    await fs.promises.rm(tmp, { force: true });
    return fail(e instanceof Error && e.message.startsWith('Архив') ? e.message : 'Загрузка прервалась. Попробуйте ещё раз.');
  }
  if (!size) {
    await fs.promises.rm(tmp, { force: true });
    return fail('Файл пустой');
  }

  // Разбор идёт потоком строк NDJSON: прокси не обрывает долгую обработку, а клиент видит прогресс
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(ctrl) {
      const send = (o: object) => ctrl.enqueue(enc.encode(JSON.stringify(o) + '\n'));
      const ping = setInterval(() => send({ stage: 'wait' }), 10_000);
      let zip: yauzl.ZipFile | null = null;
      try {
        send({ stage: 'parse' });
        const head = Buffer.alloc(4);
        const fd = await fs.promises.open(tmp, 'r');
        await fd.read(head, 0, 4, 0);
        await fd.close();
        const isZip = head.readUInt32LE(0) === 0x04034b50;

        let raw: unknown;
        let readFile: ((p: string) => Promise<Buffer | null>) | undefined;
        if (isZip) {
          zip = await openZip(tmp);
          const entries = await listEntries(zip);
          const jsons = [...entries.keys()].filter((n) => n.toLowerCase().endsWith('.json') && !n.startsWith('__MACOSX/'));
          const main =
            jsons.filter((n) => n === 'family.json' || n.endsWith('/family.json')).sort((a, b) => a.length - b.length)[0] ?? (jsons.length === 1 ? jsons[0] : null);
          if (!main) throw new Error('В архиве нет файла family.json. Загрузите архив, скачанный в настройках семьи, или JSON-файл дерева.');
          const buf = await readEntry(zip, entries.get(main)!, MAX_JSON);
          if (!buf) throw new Error('Файл family.json слишком большой');
          raw = JSON.parse(buf.toString('utf8').replace(/^\uFEFF/, ''));
          const base = main.includes('/') ? main.slice(0, main.lastIndexOf('/') + 1) : '';
          const z = zip;
          readFile = async (p) => {
            const clean = p.replace(/^\.?\//, '');
            const e = entries.get(base + clean) ?? entries.get(clean);
            return e ? readEntry(z, e, MAX_FILE) : null;
          };
        } else {
          if (size > MAX_JSON) throw new Error('JSON-файл слишком большой (больше 30 МБ)');
          const txt = (await fs.promises.readFile(tmp, 'utf8')).replace(/^\uFEFF/, '');
          try {
            raw = JSON.parse(txt);
          } catch {
            const m = txt.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (!m) throw new Error('Не удалось прочитать JSON: проверьте, что файл не обрезан и в нём нет лишнего текста');
            raw = JSON.parse(m[1]);
          }
        }

        const data = normalizeImport(raw);
        const customName = url.searchParams.get('name')?.trim().slice(0, 120);
        if (customName) data.name = customName;
        let last = 0;
        const result = await importFamily({
          userId: user.id,
          target: target === 'new' ? 'new' : { familyId: target },
          data,
          fallbackName: fileName.replace(/\.(zip|json)$/i, '').replace(/^golos-roda-/, '').slice(0, 120) || 'Загруженная семья',
          readFile,
          onProgress: (done, total) => {
            if (Date.now() - last < 400 && done < total) return;
            last = Date.now();
            send({ stage: 'files', done, total });
          },
        });
        send({ ok: true, ...result, warnings: result.warnings.slice(0, 50), moreWarnings: Math.max(0, result.warnings.length - 50) });
      } catch (e) {
        send({ error: e instanceof SyntaxError ? 'Не удалось прочитать JSON: файл повреждён или это не JSON' : e instanceof Error ? e.message : 'Ошибка загрузки' });
      } finally {
        clearInterval(ping);
        zip?.close();
        await fs.promises.rm(tmp, { force: true });
        ctrl.close();
      }
    },
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' },
  });
}

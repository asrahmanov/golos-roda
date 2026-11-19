'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowRight, CheckCircle2, FileArchive, FileJson, Loader2, UploadCloud, X } from 'lucide-react';
import { cn, formatSize, plural } from '@/lib/utils';

type Result = { familyId: string; persons: number; relations: number; materials: number; files: number; warnings: string[]; moreWarnings: number };

export function ImportForm({ families, defaultTarget }: { families: { id: string; name: string }[]; defaultTarget: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [target, setTarget] = useState(families.some((f) => f.id === defaultTarget) ? defaultTarget : 'new');
  const [name, setName] = useState('');
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [stage, setStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const busy = progress !== null;

  const pick = (f: File | undefined | null) => {
    if (!f) return;
    if (!/\.(zip|json)$/i.test(f.name)) return setError('Нужен файл .zip (архив, скачанный с сайта) или .json (дерево)');
    setError(null);
    setResult(null);
    setFile(f);
  };

  const submit = () => {
    if (!file || busy) return;
    setError(null);
    setResult(null);
    setProgress(0);
    const q = new URLSearchParams({ target });
    if (target === 'new' && name.trim()) q.set('name', name.trim());
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/import?${q}`);
    xhr.setRequestHeader('x-file-name', encodeURIComponent(file.name));
    xhr.setRequestHeader('content-type', file.type || 'application/octet-stream');
    xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(e.loaded / e.total);
    const lines = () =>
      xhr.responseText
        .split('\n')
        .filter(Boolean)
        .map((l) => {
          try {
            return JSON.parse(l) as Result & { error?: string; ok?: boolean; stage?: string; done?: number; total?: number };
          } catch {
            return null;
          }
        })
        .filter((x) => x !== null);
    xhr.onprogress = () => {
      const f = lines().filter((l) => l.stage === 'files').pop();
      if (f?.total) setStage(`Сохраняем фото и материалы: ${f.done} из ${f.total}`);
    };
    xhr.onload = () => {
      setProgress(null);
      setStage(null);
      const body = lines().filter((l) => l.ok || l.error).pop() ?? null;
      if (xhr.status >= 400 || !body || body.error) {
        setError(body?.error ?? (xhr.status === 413 ? 'Файл слишком большой для загрузки' : 'Не удалось загрузить файл. Попробуйте ещё раз.'));
        return;
      }
      setResult(body);
      setFile(null);
      router.refresh();
    };
    xhr.onerror = () => {
      setProgress(null);
      setStage(null);
      setError('Соединение прервалось. Проверьте интернет и попробуйте ещё раз.');
    };
    xhr.send(file);
  };

  const Icon = file && /\.json$/i.test(file.name) ? FileJson : FileArchive;

  return (
    <div className="grid gap-5">
      <div
        role="button"
        tabIndex={0}
        onClick={() => !busy && input.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          pick(e.dataTransfer.files[0]);
        }}
        className={cn(
          'grid cursor-pointer place-items-center rounded-3xl border-2 border-dashed p-8 text-center transition sm:p-10',
          drag ? 'border-gold-500 bg-gold-500/10' : 'border-ink-900/15 hover:border-gold-500 hover:bg-gold-500/5',
        )}
      >
        <input ref={input} type="file" accept=".zip,.json,application/zip,application/json" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        {file ? (
          <div className="flex items-center gap-4 text-left">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-ink-900 text-gold-400">
              <Icon className="h-6 w-6" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-semibold">{file.name}</span>
              <span className="text-sm text-ink-500">{formatSize(file.size)} · нажмите, чтобы выбрать другой</span>
            </span>
          </div>
        ) : (
          <div>
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-cream-200 text-ink-600">
              <UploadCloud className="h-6 w-6" />
            </span>
            <p className="mt-4 font-semibold">Перетащите файл сюда или нажмите, чтобы выбрать</p>
            <p className="mt-1 text-sm text-ink-500">ZIP-архив, скачанный в настройках семьи, или JSON-файл дерева</p>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">Куда загрузить</span>
          <select value={target} onChange={(e) => setTarget(e.target.value)} className="input" disabled={busy}>
            <option value="new">В новое семейное пространство</option>
            {families.map((f) => (
              <option key={f.id} value={f.id}>Добавить в «{f.name}»</option>
            ))}
          </select>
        </label>
        {target === 'new' ? (
          <label className="block">
            <span className="label">Название (необязательно)</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Возьмём из файла" className="input" disabled={busy} />
          </label>
        ) : (
          <p className="self-end rounded-2xl bg-cream-100 px-4 py-3 text-sm text-ink-600">Люди из файла добавятся к уже существующим. Совпадения не объединяются — проверьте, что дерево ещё не загружено.</p>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-start gap-2 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError(null)} aria-label="Скрыть"><X className="h-4 w-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {busy && (
        <div>
          <div className="h-2 overflow-hidden rounded-full bg-cream-200">
            <motion.div className="h-full rounded-full bg-gold-500" animate={{ width: `${Math.round((progress ?? 0) * 100)}%` }} />
          </div>
          <p className="mt-2 flex items-center gap-2 text-sm text-ink-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {progress !== null && progress < 1 ? `Загружаем файл… ${Math.round(progress * 100)}%` : stage ?? 'Разбираем архив и строим дерево…'}
          </p>
        </div>
      )}

      <button type="button" onClick={submit} disabled={!file || busy} className="btn-gold w-fit">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />} Загрузить
      </button>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-sage-500/12 p-6">
            <p className="flex items-center gap-2 font-semibold text-sage-500">
              <CheckCircle2 className="h-5 w-5" /> Готово
            </p>
            <p className="mt-2 text-ink-700">
              Загружено: {result.persons} {plural(result.persons, ['человек', 'человека', 'человек'])}, {result.relations}{' '}
              {plural(result.relations, ['связь', 'связи', 'связей'])}
              {result.materials > 0 && `, ${result.materials} ${plural(result.materials, ['материал', 'материала', 'материалов'])}`}
              {result.files > 0 && ` и ${result.files} ${plural(result.files, ['файл', 'файла', 'файлов'])}`}.
            </p>
            {result.warnings.length > 0 && (
              <details className="mt-4 rounded-2xl bg-white/70 p-4 text-sm">
                <summary className="cursor-pointer font-semibold text-ink-700">
                  Замечания ({result.warnings.length + result.moreWarnings}) — проверьте эти места в дереве
                </summary>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-ink-600">
                  {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
                  {result.moreWarnings > 0 && <li>…и ещё {result.moreWarnings}</li>}
                </ul>
              </details>
            )}
            <Link href={`/app/family/${result.familyId}`} className="btn-dark btn-sm mt-5">
              Открыть дерево <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CopyBlock({ title, text, fileName }: { title: string; text: string; fileName?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl bg-ink-900 text-cream-50">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="text-xs font-semibold text-cream-100/70">{title}</span>
        <span className="flex gap-1.5">
          {fileName && (
            <button
              type="button"
              onClick={() => {
                const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="rounded-full px-3 py-1 text-xs font-semibold text-gold-300 hover:bg-white/10"
            >
              Скачать
            </button>
          )}
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            }}
            className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-gold-300 hover:bg-white/20"
          >
            {copied ? 'Скопировано' : 'Копировать'}
          </button>
        </span>
      </div>
      <pre className="max-h-80 overflow-auto p-4 text-[12px] leading-relaxed text-cream-100/85"><code>{text}</code></pre>
    </div>
  );
}

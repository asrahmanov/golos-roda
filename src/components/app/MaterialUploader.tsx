'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { FileUp, Link2, Loader2, Mic, PenLine, Square, Trash2, Upload, X, CheckCircle2 } from 'lucide-react';
import { createTextMaterialAction } from '@/actions/family';
import { FormMessage, SubmitButton } from '@/components/ui/Form';
import { cn, formatSize } from '@/lib/utils';

type Opt = { id: string; name: string };
type Tab = 'file' | 'memory' | 'voice' | 'link';

function PersonPicker({ persons, defaultIds }: { persons: Opt[]; defaultIds: string[] }) {
  const [sel, setSel] = useState<string[]>(defaultIds);
  const [q, setQ] = useState('');
  const list = persons.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <span className="label">Кто на материале / о ком он</span>
      {sel.map((id) => <input key={id} type="hidden" name="personIds" value={id} />)}
      <div className="flex flex-wrap gap-1.5">
        {sel.map((id) => (
          <button type="button" key={id} onClick={() => setSel(sel.filter((x) => x !== id))} className="chip bg-ink-900 text-cream-50">
            {persons.find((p) => p.id === id)?.name} <X className="h-3 w-3" />
          </button>
        ))}
      </div>
      {persons.length > 0 && (
        <>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Найти родственника" className="input mt-2 py-2 text-sm" />
          <div className="mt-2 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
            {list.filter((p) => !sel.includes(p.id)).slice(0, 30).map((p) => (
              <button type="button" key={p.id} onClick={() => setSel([...sel, p.id])} className="chip border border-ink-900/12 text-ink-600 hover:border-gold-500">
                + {p.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CommonFields({ persons, defaultPersonIds, tasks, defaultTaskId }: { persons: Opt[]; defaultPersonIds: string[]; tasks: Opt[]; defaultTaskId?: string }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="dateText" placeholder="Когда (год, дата, «лето 1965»)" className="input" />
        <input name="place" placeholder="Где" className="input" />
      </div>
      <PersonPicker persons={persons} defaultIds={defaultPersonIds} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label">Кто видит</span>
          <select name="visibility" className="input" defaultValue="FAMILY">
            <option value="FAMILY">Вся семья</option>
            <option value="EDITORS">Только хранители и соавторы</option>
            <option value="PRIVATE">Только я (черновик)</option>
          </select>
        </label>
        {tasks.length > 0 && (
          <label className="block">
            <span className="label">В рамках задания</span>
            <select name="taskId" className="input" defaultValue={defaultTaskId ?? ''}>
              <option value="">— без задания —</option>
              {tasks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
        )}
      </div>
    </>
  );
}

function uploadWithProgress(url: string, fd: FormData, onProgress: (p: number) => void) {
  return new Promise<{ ok?: boolean; error?: string; materialId?: string }>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      try {
        resolve(JSON.parse(xhr.responseText));
      } catch {
        resolve({ error: xhr.status === 413 ? 'Файл слишком большой' : 'Ошибка загрузки' });
      }
    };
    xhr.onerror = () => resolve({ error: 'Нет соединения с сервером' });
    xhr.send(fd);
  });
}

function FileTab({ familyId, onDone, ...common }: { familyId: string; onDone: () => void } & Parameters<typeof CommonFields>[0]) {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<Record<number, number | 'done' | string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.length) return setError('Выберите файлы');
    setBusy(true);
    setError(null);
    let failed = 0;
    for (let i = 0; i < files.length; i++) {
      if (progress[i] === 'done') continue;
      const fd = new FormData(formRef.current!);
      fd.delete('files');
      fd.set('file', files[i]);
      if (files.length > 1 && fd.get('title')) fd.set('title', `${fd.get('title')} (${i + 1})`);
      const res = await uploadWithProgress(`/api/families/${familyId}/upload`, fd, (p) => setProgress((s) => ({ ...s, [i]: p })));
      if (res.ok) setProgress((s) => ({ ...s, [i]: 'done' }));
      else {
        failed++;
        setProgress((s) => ({ ...s, [i]: res.error ?? 'Ошибка' }));
      }
    }
    setBusy(false);
    if (!failed) onDone();
  };

  return (
    <form ref={formRef} onSubmit={submit} className="grid gap-4">
      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); setFiles([...files, ...Array.from(e.dataTransfer.files)].slice(0, 20)); }}
        className={cn('grid cursor-pointer place-items-center rounded-3xl border-2 border-dashed p-8 text-center transition', drag ? 'border-gold-500 bg-gold-500/10' : 'border-ink-900/15 hover:border-gold-500 hover:bg-cream-100')}
      >
        <input type="file" name="files" multiple className="sr-only" accept="image/*,application/pdf,.doc,.docx,.txt,audio/*,video/mp4,video/quicktime,video/webm" onChange={(e) => setFiles([...files, ...Array.from(e.target.files ?? [])].slice(0, 20))} />
        <Upload className="h-8 w-8 text-gold-600" />
        <span className="mt-3 font-semibold">Перетащите файлы или нажмите, чтобы выбрать</span>
        <span className="mt-1 text-xs text-ink-500">Фото до 20 МБ · документы до 25 МБ · аудио до 60 МБ · видео до 200 МБ</span>
      </label>
      {files.length > 0 && (
        <ul className="grid gap-2">
          {files.map((f, i) => {
            const p = progress[i];
            return (
              <li key={i} className="flex items-center gap-3 rounded-2xl bg-cream-100 px-4 py-2.5 text-sm">
                <FileUp className="h-4 w-4 shrink-0 text-ink-400" />
                <span className="min-w-0 flex-1 truncate">{f.name}</span>
                <span className="shrink-0 text-xs text-ink-400">{formatSize(f.size)}</span>
                {p === 'done' ? (
                  <CheckCircle2 className="h-4 w-4 text-sage-500" />
                ) : typeof p === 'number' ? (
                  <span className="w-10 text-right text-xs font-semibold tabular-nums">{Math.round(p * 100)}%</span>
                ) : typeof p === 'string' ? (
                  <span className="max-w-[10rem] truncate text-xs text-rose-500" title={p}>{p}</span>
                ) : (
                  !busy && (
                    <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label="Убрать">
                      <Trash2 className="h-4 w-4 text-ink-400 hover:text-rose-500" />
                    </button>
                  )
                )}
              </li>
            );
          })}
        </ul>
      )}
      <input name="title" placeholder={files.length > 1 ? 'Общее название (необязательно)' : 'Название, например «Свадьба бабушки и дедушки»'} className="input" />
      <textarea name="body" rows={3} placeholder="Подпись или история, связанная с материалом" className="input resize-none" />
      <label className="flex items-center gap-2 text-sm text-ink-600">
        <input type="checkbox" name="type" value="DOCUMENT" className="h-4 w-4 accent-gold-600" /> Это скан документа (а не фотография)
      </label>
      <CommonFields {...common} />
      {error && <p className="text-sm text-rose-500">{error}</p>}
      <button type="submit" disabled={busy} className="btn-gold py-4">
        {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Загружаем…</> : `Загрузить${files.length > 1 ? ` (${files.length})` : ''}`}
      </button>
    </form>
  );
}

function VoiceTab({ familyId, onDone, ...common }: { familyId: string; onDone: () => void } & Parameters<typeof CommonFields>[0]) {
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [secs, setSecs] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pr, setPr] = useState(0);
  const chunks = useRef<Blob[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!rec) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [rec]);

  const start = async () => {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';
      const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setBlob(new Blob(chunks.current, { type: r.mimeType || 'audio/webm' }));
      };
      r.start(1000);
      setSecs(0);
      setBlob(null);
      setRec(r);
    } catch {
      setErr('Нет доступа к микрофону. Разрешите его в настройках браузера.');
    }
  };
  const stop = () => {
    rec?.stop();
    setRec(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blob) return;
    setBusy(true);
    const fd = new FormData(formRef.current!);
    const type = blob.type.split(';')[0];
    const ext = type.includes('mp4') ? 'm4a' : 'webm';
    fd.set('file', new File([blob], `voice-${Date.now()}.${ext}`, { type }));
    if (!fd.get('title')) fd.set('title', 'Голосовое воспоминание');
    const res = await uploadWithProgress(`/api/families/${familyId}/upload`, fd, setPr);
    setBusy(false);
    if (res.ok) onDone();
    else setErr(res.error ?? 'Ошибка');
  };

  const mm = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  return (
    <form ref={formRef} onSubmit={submit} className="grid gap-4">
      <div className="grid place-items-center rounded-3xl bg-ink-900 px-6 py-10 text-cream-50">
        <button
          type="button"
          onClick={rec ? stop : start}
          className={cn('relative grid h-24 w-24 place-items-center rounded-full transition', rec ? 'bg-rose-500' : 'bg-gold-500 text-ink-950 hover:scale-105')}
          aria-label={rec ? 'Остановить запись' : 'Начать запись'}
        >
          {rec && <span className="absolute inset-0 animate-ping rounded-full bg-rose-500/50" />}
          {rec ? <Square className="relative h-8 w-8" /> : <Mic className="h-10 w-10" />}
        </button>
        <p className="mt-5 font-serif text-3xl tabular-nums">{mm}</p>
        <p className="mt-1 text-sm text-cream-100/60">{rec ? 'Идёт запись… Нажмите, чтобы остановить' : blob ? 'Запись готова — прослушайте и сохраните' : 'Попросите родственника рассказать историю'}</p>
        {blob && !rec && <audio controls src={URL.createObjectURL(blob)} className="mt-5 w-full max-w-sm" />}
      </div>
      <p className="text-xs text-ink-500">Записывайте голос только с согласия рассказчика.</p>
      <input name="title" placeholder="О чём рассказ, например «Бабушка о детстве в деревне»" className="input" />
      <textarea name="body" rows={2} placeholder="Краткое содержание или расшифровка" className="input resize-none" />
      <CommonFields {...common} />
      {err && <p className="text-sm text-rose-500">{err}</p>}
      <button type="submit" disabled={!blob || busy || !!rec} className="btn-gold py-4">
        {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> {Math.round(pr * 100)}%</> : 'Сохранить запись'}
      </button>
    </form>
  );
}

function TextTab({ familyId, type, onDone, ...common }: { familyId: string; type: 'MEMORY' | 'LINK'; onDone: () => void } & Parameters<typeof CommonFields>[0]) {
  const [state, action] = useActionState(createTextMaterialAction, undefined);
  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="familyId" value={familyId} />
      <input type="hidden" name="type" value={type} />
      <input name="title" required placeholder={type === 'MEMORY' ? 'Заголовок, например «Как дедушка вернулся с фронта»' : 'Название'} className="input" />
      {type === 'LINK' && <input name="externalUrl" type="url" required placeholder="https://… (видео, облако, архивная запись)" className="input" />}
      <textarea
        name="body"
        rows={type === 'MEMORY' ? 9 : 3}
        required={type === 'MEMORY'}
        placeholder={type === 'MEMORY' ? 'Запишите воспоминание так, как его рассказывали. Детали, имена, запахи, слова — всё важно.' : 'Описание'}
        className="input"
      />
      <CommonFields {...common} />
      <FormMessage state={state} />
      <SubmitButton className="btn-gold py-4">Сохранить</SubmitButton>
    </form>
  );
}

export function MaterialUploader({
  familyId,
  persons,
  tasks = [],
  defaultPersonIds = [],
  defaultTaskId,
  defaultTab = 'file',
  label = 'Добавить материал',
  className = 'btn-gold',
}: {
  familyId: string;
  persons: Opt[];
  tasks?: Opt[];
  defaultPersonIds?: string[];
  defaultTaskId?: string;
  defaultTab?: Tab;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>(defaultTab);
  const router = useRouter();
  const done = () => {
    setOpen(false);
    router.refresh();
  };
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);
  const common = { persons, defaultPersonIds, tasks, defaultTaskId };
  const tabs: { k: Tab; l: string; I: typeof Upload }[] = [
    { k: 'file', l: 'Файлы', I: Upload },
    { k: 'memory', l: 'Воспоминание', I: PenLine },
    { k: 'voice', l: 'Голос', I: Mic },
    { k: 'link', l: 'Ссылка', I: Link2 },
  ];

  return (
    <>
      <button type="button" onClick={() => { setTab(defaultTab); setOpen(true); }} className={className}>
        <Upload className="h-4 w-4" /> {label}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink-950/60 backdrop-blur-sm sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.div
              className="max-h-[92svh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] bg-cream-50 p-5 shadow-2xl sm:rounded-[2rem] sm:p-8"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-2xl font-semibold">Пополнить архив</h3>
                <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-ink-900/5" aria-label="Закрыть">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-5 grid grid-cols-4 gap-1 rounded-2xl bg-cream-200/70 p-1">
                {tabs.map((t) => (
                  <button key={t.k} onClick={() => setTab(t.k)} className={cn('flex flex-col items-center gap-1 rounded-xl py-2.5 text-xs font-semibold transition sm:flex-row sm:justify-center sm:gap-2 sm:text-sm', tab === t.k ? 'bg-white shadow' : 'text-ink-500 hover:text-ink-900')}>
                    <t.I className="h-4 w-4" /> {t.l}
                  </button>
                ))}
              </div>
              <div className="mt-6">
                {tab === 'file' && <FileTab familyId={familyId} onDone={done} {...common} />}
                {tab === 'memory' && <TextTab familyId={familyId} type="MEMORY" onDone={done} {...common} />}
                {tab === 'voice' && <VoiceTab familyId={familyId} onDone={done} {...common} />}
                {tab === 'link' && <TextTab familyId={familyId} type="LINK" onDone={done} {...common} />}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

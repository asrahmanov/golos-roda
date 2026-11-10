import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Download, ExternalLink, FileText, Lock, MapPin, Megaphone, Pencil, Trash2, X } from 'lucide-react';
import { db } from '@/lib/db';
import { canEdit, personShortName, requireFamily, visibilityFilter } from '@/lib/family';
import { MATERIAL_LABEL, VISIBILITY_LABEL } from '@/lib/constants';
import { fileUrl } from '@/lib/storage';
import { formatDate, formatSize, initials, timeAgo } from '@/lib/utils';
import { deleteCommentAction, deleteMaterialAction } from '@/actions/family';
import { ConfirmButton } from '@/components/ui/Form';
import { Paragraphs } from '@/components/ui/Paragraphs';
import { CommentForm, MaterialEditForm, SubmitStoryForm } from '@/components/app/MaterialForms';

export default async function MaterialPage({ params }: { params: Promise<{ id: string; mid: string }> }) {
  const { id, mid } = await params;
  const { user, role } = await requireFamily(id);
  const m = await db.material.findFirst({
    where: { id: mid, familyId: id, ...visibilityFilter(role, user.id) },
    include: {
      file: true,
      author: { select: { name: true } },
      persons: { include: { person: true } },
      comments: { include: { author: { select: { id: true, name: true } } }, orderBy: { createdAt: 'asc' } },
      completions: { include: { task: { select: { title: true } } } },
    },
  });
  if (!m) notFound();
  const editable = canEdit(role) && (m.visibility !== 'PRIVATE' || m.authorId === user.id);
  const canDelete = m.authorId === user.id || role === 'OWNER';
  const all = editable ? await db.person.findMany({ where: { familyId: id }, select: { id: true, firstName: true, lastName: true }, orderBy: { firstName: 'asc' } }) : [];
  const src = fileUrl(m.fileId);
  const mime = m.file?.mime ?? '';

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <Link href={`/app/family/${id}/archive`} className="inline-flex items-center gap-2 text-sm font-semibold text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" /> Архив
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-[2rem] bg-ink-900">
            {m.type === 'PHOTO' || (m.type === 'DOCUMENT' && mime.startsWith('image/')) ? (
              <a href={src!} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src!} alt={m.title} className="mx-auto max-h-[75vh] w-auto object-contain" />
              </a>
            ) : m.type === 'VIDEO' && src ? (
              <video controls preload="metadata" playsInline src={src} className="max-h-[75vh] w-full" />
            ) : m.type === 'AUDIO' && src ? (
              <div className="p-8 sm:p-12">
                <div className="mb-8 flex h-24 items-end justify-center gap-1.5">
                  {Array.from({ length: 40 }, (_, i) => (
                    <span key={i} className="w-1.5 animate-pulse rounded-full bg-gold-400/70" style={{ height: `${20 + Math.abs(Math.sin(i * 1.7)) * 80}%`, animationDelay: `${i * 60}ms` }} />
                  ))}
                </div>
                <audio controls preload="metadata" src={src} className="w-full" />
              </div>
            ) : m.type === 'DOCUMENT' && mime === 'application/pdf' ? (
              <iframe src={src!} className="h-[75vh] w-full bg-white" title={m.title} />
            ) : m.type === 'MEMORY' ? (
              <div className="bg-cream-100 p-8 sm:p-12">
                <span className="font-serif text-7xl leading-none text-gold-400">“</span>
                <Paragraphs text={m.body ?? ''} className="font-serif text-xl leading-relaxed text-ink-800" />
              </div>
            ) : m.type === 'LINK' ? (
              <div className="p-10 text-center text-cream-50">
                <ExternalLink className="mx-auto h-10 w-10 text-gold-400" />
                <a href={m.externalUrl!} target="_blank" rel="noreferrer noopener" className="btn-gold mt-6">Открыть ссылку</a>
                <p className="mt-4 break-all text-sm text-cream-100/50">{m.externalUrl}</p>
              </div>
            ) : (
              <div className="p-10 text-center text-cream-50">
                <FileText className="mx-auto h-12 w-12 text-gold-400" />
                <p className="mt-4">{m.file?.originalName}</p>
              </div>
            )}
          </div>

          <section className="card p-6 sm:p-8">
            <h3 className="font-serif text-xl font-semibold">Обсуждение <span className="text-ink-300">{m.comments.length}</span></h3>
            <div className="mt-5 space-y-4">
              {m.comments.map((c) => (
                <div key={c.id} className="group flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink-900 text-xs font-bold text-gold-300">{initials(c.author.name)}</span>
                  <div className="min-w-0 flex-1 rounded-2xl bg-cream-100 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold">{c.author.name}</span>
                      <span className="text-ink-400">{timeAgo(c.createdAt)}</span>
                      {(c.author.id === user.id || role === 'OWNER') && (
                        <form action={deleteCommentAction} className="ml-auto">
                          <input type="hidden" name="id" value={c.id} />
                          <button className="text-ink-300 opacity-0 hover:text-rose-500 group-hover:opacity-100 max-sm:opacity-100" aria-label="Удалить комментарий"><X className="h-3.5 w-3.5" /></button>
                        </form>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-line text-sm">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5"><CommentForm materialId={m.id} /></div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-6">
            <span className="chip bg-gold-500/12 text-gold-700">{MATERIAL_LABEL[m.type]}</span>
            <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight">{m.title}</h2>
            {m.body && m.type !== 'MEMORY' && <Paragraphs text={m.body} className="mt-4 text-ink-700" />}
            <dl className="mt-5 space-y-2 text-sm">
              {m.dateText && <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gold-600" /> {m.dateText}</div>}
              {m.place && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold-600" /> {m.place}</div>}
              <div className="flex items-center gap-2"><Lock className="h-4 w-4 text-gold-600" /> {VISIBILITY_LABEL[m.visibility]}</div>
            </dl>
            {m.persons.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {m.persons.map(({ person }) => (
                  <Link key={person.id} href={`/app/family/${id}/person/${person.id}`} className="chip bg-cream-100 px-3 py-1.5 text-ink-700 hover:bg-cream-200">
                    {personShortName(person)}
                  </Link>
                ))}
              </div>
            )}
            {m.completions.length > 0 && <p className="mt-4 text-xs font-semibold text-sage-500">✓ Задание: {m.completions[0].task.title}</p>}
            <p className="mt-5 border-t border-ink-900/8 pt-4 text-xs text-ink-400">
              Добавил(а) {m.author?.name ?? 'участник'} · {formatDate(m.createdAt)}
              {m.file && ` · ${formatSize(m.file.size)}`}
            </p>
            {src && (
              <a href={`${src}?download=1`} className="btn-ghost btn-sm mt-4 w-full">
                <Download className="h-4 w-4" /> Скачать оригинал
              </a>
            )}
          </section>

          {editable && (
            <details className="card group p-6">
              <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold"><Pencil className="h-4 w-4 text-gold-600" /> Редактировать</summary>
              <div className="mt-5">
                <MaterialEditForm
                  m={m}
                  persons={all.map((p) => ({ id: p.id, name: personShortName(p) }))}
                  selected={m.persons.map((p) => p.personId)}
                  canChangeVisibility={m.authorId === user.id || role === 'OWNER'}
                />
              </div>
            </details>
          )}

          {editable && m.visibility === 'FAMILY' && ['MEMORY', 'PHOTO', 'AUDIO', 'VIDEO'].includes(m.type) && (
            <details className="group rounded-3xl bg-ink-900 p-6 text-cream-50">
              <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold"><Megaphone className="h-4 w-4 text-gold-400" /> Поделиться на экспозиции</summary>
              <p className="mt-3 text-sm text-cream-100/60">История появится в публичном разделе «Истории, которые нас объединяют» после модерации.</p>
              <div className="mt-5 rounded-2xl bg-cream-50 p-5 text-ink-900">
                <SubmitStoryForm familyId={id} materialId={m.id} title={m.title} text={m.body ?? ''} authorName={user.name} />
              </div>
            </details>
          )}

          {canDelete && (
            <form action={deleteMaterialAction}>
              <input type="hidden" name="id" value={m.id} />
              <ConfirmButton message="Удалить материал без возможности восстановления?" className="btn btn-sm text-rose-500 hover:bg-rose-500/10">
                <Trash2 className="h-4 w-4" /> Удалить материал
              </ConfirmButton>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}

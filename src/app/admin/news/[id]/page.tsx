import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/db';
import { fileUrl } from '@/lib/storage';
import { saveNewsAction } from '@/actions/admin';
import { Field, SubmitButton } from '@/components/ui/Form';
import { ActionForm } from '@/components/admin/ActionForm';

export default async function NewsEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const n = id === 'new' ? null : await db.news.findUnique({ where: { id } });
  if (id !== 'new' && !n) notFound();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/admin/news" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-500 hover:text-ink-900"><ArrowLeft className="h-4 w-4" /> Новости</Link>
      <h1 className="h-display text-4xl">{n ? 'Редактирование' : 'Новая новость'}</h1>
      <ActionForm action={saveNewsAction} className="card grid gap-4 p-6 sm:p-8">
        {n && <input type="hidden" name="id" value={n.id} />}
        <Field label="Заголовок"><input name="title" defaultValue={n?.title} required className="input" /></Field>
        <Field label="Краткое описание"><textarea name="excerpt" defaultValue={n?.excerpt ?? ''} rows={2} className="input" /></Field>
        <Field label="Текст" hint="Абзацы разделяйте пустой строкой. Подзаголовок — строка, начинающаяся с «## »">
          <textarea name="body" defaultValue={n?.body} required rows={14} className="input" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Адрес (slug)" hint="Оставьте пустым — сформируется из заголовка"><input name="slug" defaultValue={n?.slug} className="input" /></Field>
          <Field label="Дата публикации"><input name="publishedAt" type="date" defaultValue={(n?.publishedAt ?? new Date()).toISOString().slice(0, 10)} className="input" /></Field>
        </div>
        <Field label="Обложка">
          {n?.coverId && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fileUrl(n.coverId, true)!} alt="" className="mb-3 h-32 rounded-xl object-cover" />
          )}
          <input name="cover" type="file" accept="image/*" className="block text-sm" />
        </Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={n?.published ?? true} className="h-4 w-4 accent-gold-600" /> Опубликовать на сайте</label>
        <SubmitButton className="btn-gold w-fit">Сохранить</SubmitButton>
      </ActionForm>
    </div>
  );
}

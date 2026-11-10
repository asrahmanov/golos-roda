import Link from 'next/link';
import { Plus, Trash2 } from 'lucide-react';
import { db } from '@/lib/db';
import { fileUrl } from '@/lib/storage';
import { formatDate } from '@/lib/utils';
import { deleteNewsAction } from '@/actions/admin';
import { ConfirmButton } from '@/components/ui/Form';

export default async function NewsAdminPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const sp = await searchParams;
  const news = await db.news.findMany({ orderBy: { publishedAt: 'desc' } });
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Контент</p>
          <h1 className="h-display mt-2 text-4xl">Новости</h1>
        </div>
        <Link href="/admin/news/new" className="btn-gold btn-sm"><Plus className="h-4 w-4" /> Новость</Link>
      </div>
      {sp.saved && <p className="rounded-2xl bg-sage-500/12 px-5 py-3 text-sm text-sage-500">Новость сохранена</p>}
      <div className="grid gap-3">
        {news.length === 0 && <p className="card p-10 text-center text-ink-400">Новостей пока нет</p>}
        {news.map((n) => (
          <div key={n.id} className="card flex items-center gap-4 p-4">
            <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-cream-100">
              {n.coverId && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fileUrl(n.coverId, true)!} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <Link href={`/admin/news/${n.id}`} className="min-w-0 flex-1">
              <p className="truncate font-semibold hover:text-gold-700">{n.title}</p>
              <p className="text-xs text-ink-400">{formatDate(n.publishedAt)} · {n.published ? 'опубликована' : 'черновик'}</p>
            </Link>
            {n.published && <Link href={`/news/${n.slug}`} target="_blank" className="hidden text-xs text-gold-700 hover:underline sm:block">на сайте ↗</Link>}
            <form action={deleteNewsAction}>
              <input type="hidden" name="id" value={n.id} />
              <ConfirmButton message="Удалить новость?" className="grid h-9 w-9 place-items-center rounded-xl text-ink-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 className="h-4 w-4" /></ConfirmButton>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}

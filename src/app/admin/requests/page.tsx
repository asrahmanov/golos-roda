import Link from 'next/link';
import type { RequestStatus } from '@prisma/client';
import { Trash2 } from 'lucide-react';
import { db } from '@/lib/db';
import { REQUEST_KIND_LABEL, REQUEST_STATUS_LABEL } from '@/lib/constants';
import { cn, formatDate } from '@/lib/utils';
import { deleteRequestAction, updateRequestAction } from '@/actions/admin';
import { ConfirmButton } from '@/components/ui/Form';
import { AutoSubmitSelect } from '@/components/admin/AutoSubmitSelect';

const ST: RequestStatus[] = ['NEW', 'IN_PROGRESS', 'DONE', 'ARCHIVED'];

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const status = ST.includes(sp.status as RequestStatus) ? (sp.status as RequestStatus) : undefined;
  const [rows, counts] = await Promise.all([
    db.partnerRequest.findMany({ where: status ? { status } : { status: { not: 'ARCHIVED' } }, orderBy: { createdAt: 'desc' } }),
    db.partnerRequest.groupBy({ by: ['status'], _count: true }),
  ]);
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Партнёрства</p>
        <h1 className="h-display mt-2 text-4xl">Заявки партнёров и обращения</h1>
      </div>
      <div className="scrollbar-none flex gap-2 overflow-x-auto">
        <Link href="/admin/requests" className={cn('chip shrink-0 px-4 py-2', !status ? 'bg-ink-900 text-cream-50' : 'bg-white text-ink-600')}>Активные</Link>
        {ST.map((s) => (
          <Link key={s} href={`/admin/requests?status=${s}`} className={cn('chip shrink-0 px-4 py-2', status === s ? 'bg-ink-900 text-cream-50' : 'bg-white text-ink-600')}>
            {REQUEST_STATUS_LABEL[s]} <span className="opacity-60">{counts.find((c) => c.status === s)?._count ?? 0}</span>
          </Link>
        ))}
      </div>
      <div className="grid gap-4">
        {rows.length === 0 && <p className="card p-10 text-center text-ink-400">Заявок нет</p>}
        {rows.map((r) => (
          <div key={r.id} className="card grid gap-5 p-6 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip bg-gold-500/15 text-gold-700">{REQUEST_KIND_LABEL[r.kind]}</span>
                <span className="text-xs text-ink-400">{formatDate(r.createdAt, true)}</span>
              </div>
              <p className="mt-3 text-lg font-semibold">{r.name}{r.organization && <span className="text-ink-500"> · {r.organization}</span>}</p>
              <p className="mt-1 text-sm">
                {r.email && <a href={`mailto:${r.email}`} className="text-gold-700 hover:underline">{r.email}</a>}
                {r.email && r.phone && ' · '}
                {r.phone && <a href={`tel:${r.phone}`} className="text-gold-700 hover:underline">{r.phone}</a>}
              </p>
              <p className="mt-4 whitespace-pre-line rounded-2xl bg-cream-100 p-4 text-sm">{r.message}</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AutoSubmitSelect action={updateRequestAction} id={r.id} name="status" value={r.status} options={ST.map((s) => ({ v: s, l: REQUEST_STATUS_LABEL[s] }))} />
                <form action={deleteRequestAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <ConfirmButton message="Удалить заявку?" className="grid h-9 w-9 place-items-center rounded-xl text-ink-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 className="h-4 w-4" /></ConfirmButton>
                </form>
              </div>
              <form action={updateRequestAction} className="grid gap-2">
                <input type="hidden" name="id" value={r.id} />
                <textarea name="adminNote" defaultValue={r.adminNote ?? ''} rows={3} placeholder="Заметки команды: договорённости, ответственный, следующий шаг" className="input text-sm" />
                <button className="btn-ghost btn-sm w-fit">Сохранить заметку</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

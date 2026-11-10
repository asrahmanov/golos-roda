import type { RequestStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { REQUEST_STATUS_LABEL } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { replyTicketAction } from '@/actions/admin';

const ST: RequestStatus[] = ['NEW', 'IN_PROGRESS', 'DONE', 'ARCHIVED'];

export default async function AdminSupportPage() {
  const tickets = await db.supportTicket.findMany({ include: { user: { select: { name: true, email: true } } }, orderBy: [{ status: 'asc' }, { createdAt: 'desc' }], take: 200 });
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Помощь участникам</p>
        <h1 className="h-display mt-2 text-4xl">Обращения в поддержку</h1>
        <p className="mt-2 text-sm text-ink-500">Сброс пароля — в разделе «Пользователи». Ответ увидит пользователь в своём кабинете.</p>
      </div>
      <div className="grid gap-4">
        {tickets.length === 0 && <p className="card p-10 text-center text-ink-400">Обращений нет</p>}
        {tickets.map((t) => (
          <form key={t.id} action={replyTicketAction} className="card grid gap-4 p-6 lg:grid-cols-[1fr_1fr]">
            <input type="hidden" name="id" value={t.id} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`chip ${t.status === 'NEW' ? 'bg-gold-500 text-ink-950' : 'bg-cream-100 text-ink-600'}`}>{REQUEST_STATUS_LABEL[t.status]}</span>
                <span className="text-xs text-ink-400">{formatDate(t.createdAt, true)}</span>
              </div>
              <p className="mt-3 font-semibold">{t.subject}</p>
              <p className="text-sm text-ink-500">{t.user?.name} · {t.user?.email}</p>
              <p className="mt-3 whitespace-pre-line rounded-2xl bg-cream-100 p-4 text-sm">{t.message}</p>
            </div>
            <div className="grid content-start gap-3">
              <textarea name="reply" defaultValue={t.reply ?? ''} rows={5} placeholder="Ответ пользователю" className="input text-sm" />
              <div className="flex gap-2">
                <select name="status" defaultValue={t.status === 'NEW' ? 'DONE' : t.status} className="rounded-xl border border-ink-900/12 bg-white px-3 py-2 text-sm">
                  {ST.map((s) => <option key={s} value={s}>{REQUEST_STATUS_LABEL[s]}</option>)}
                </select>
                <button className="btn-dark btn-sm">Сохранить</button>
              </div>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}

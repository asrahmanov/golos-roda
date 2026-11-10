import { LifeBuoy } from 'lucide-react';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { REQUEST_STATUS_LABEL } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { TicketForm } from '@/components/app/ProfileForms';

export default async function SupportPage() {
  const user = await requireUser();
  const tickets = await db.supportTicket.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <p className="eyebrow">Помощь</p>
      <h1 className="h-display mt-3 text-4xl">Поддержка</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="card p-6 sm:p-8">
          <LifeBuoy className="h-8 w-8 text-gold-500" />
          <h2 className="mt-4 font-serif text-2xl font-semibold">Задайте вопрос</h2>
          <p className="mt-2 text-sm text-ink-500">Поможем разобраться с деревом, загрузкой материалов или доступом. Администраторы не видят содержимое вашего архива — опишите проблему словами.</p>
          <div className="mt-6"><TicketForm /></div>
        </section>
        <section className="card p-6 sm:p-8">
          <h2 className="font-serif text-2xl font-semibold">Мои обращения</h2>
          {tickets.length === 0 ? (
            <p className="mt-4 text-ink-400">Обращений пока нет.</p>
          ) : (
            <ul className="mt-5 space-y-4">
              {tickets.map((t) => (
                <li key={t.id} className="rounded-2xl bg-cream-100 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{t.subject}</p>
                    <span className="chip bg-white text-ink-600">{REQUEST_STATUS_LABEL[t.status]}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-400">{formatDate(t.createdAt, true)}</p>
                  <p className="mt-3 whitespace-pre-line text-sm text-ink-700">{t.message}</p>
                  {t.reply && (
                    <div className="mt-4 rounded-xl bg-ink-900 p-4 text-sm text-cream-50">
                      <p className="text-xs font-semibold text-gold-300">Ответ поддержки</p>
                      <p className="mt-1 whitespace-pre-line">{t.reply}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

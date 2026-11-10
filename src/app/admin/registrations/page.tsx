import Link from 'next/link';
import type { RegistrationStatus } from '@prisma/client';
import { Download, Trash2 } from 'lucide-react';
import { db } from '@/lib/db';
import { REG_STATUS_LABEL } from '@/lib/constants';
import { cn, formatDate } from '@/lib/utils';
import { deleteRegistrationAction, updateRegistrationAction } from '@/actions/admin';
import { ConfirmButton } from '@/components/ui/Form';
import { AutoSubmitSelect } from '@/components/admin/AutoSubmitSelect';

const ST: RegistrationStatus[] = ['NEW', 'CONFIRMED', 'ATTENDED', 'CANCELLED'];

export default async function RegistrationsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const status = ST.includes(sp.status as RegistrationStatus) ? (sp.status as RegistrationStatus) : undefined;
  const q = sp.q?.trim();
  const [rows, counts, zones] = await Promise.all([
    db.festivalRegistration.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { phone: { contains: q } }, { email: { contains: q, mode: 'insensitive' } }, { familyName: { contains: q, mode: 'insensitive' } }] } : {}),
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.festivalRegistration.groupBy({ by: ['status'], _count: true }),
    db.festivalRegistration.findMany({ where: { status: { not: 'CANCELLED' } }, select: { zones: true } }),
  ]);
  const zoneCounts = new Map<string, number>();
  for (const r of zones) for (const z of r.zones) zoneCounts.set(z, (zoneCounts.get(z) ?? 0) + 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Фестиваль</p>
          <h1 className="h-display mt-2 text-4xl">Регистрации семей</h1>
        </div>
        <a href="/admin/registrations/export" className="btn-dark btn-sm"><Download className="h-4 w-4" /> Выгрузить CSV</a>
      </div>

      {zoneCounts.size > 0 && (
        <div className="flex flex-wrap gap-2">
          {[...zoneCounts.entries()].sort((a, b) => b[1] - a[1]).map(([z, c]) => (
            <span key={z} className="chip bg-white px-3 py-1.5 text-ink-600 ring-1 ring-ink-900/8">{z}: <b>{c}</b></span>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="scrollbar-none flex gap-2 overflow-x-auto">
          <Link href="/admin/registrations" className={cn('chip shrink-0 px-4 py-2', !status ? 'bg-ink-900 text-cream-50' : 'bg-white text-ink-600')}>Все</Link>
          {ST.map((s) => (
            <Link key={s} href={`/admin/registrations?status=${s}`} className={cn('chip shrink-0 px-4 py-2', status === s ? 'bg-ink-900 text-cream-50' : 'bg-white text-ink-600')}>
              {REG_STATUS_LABEL[s]} <span className="opacity-60">{counts.find((c) => c.status === s)?._count ?? 0}</span>
            </Link>
          ))}
        </div>
        <form className="flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Имя, телефон, почта" className="input py-2" />
          <button className="btn-dark btn-sm">Найти</button>
        </form>
      </div>

      <div className="grid gap-3">
        {rows.length === 0 && <p className="card p-10 text-center text-ink-400">Заявок нет</p>}
        {rows.map((r) => (
          <div key={r.id} className="card grid gap-4 p-5 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-start">
            <div>
              <p className="font-semibold">{r.name} {r.familyName && <span className="text-ink-400">· {r.familyName}</span>}</p>
              <p className="mt-1 text-sm">
                <a href={`tel:${r.phone}`} className="text-gold-700 hover:underline">{r.phone}</a>
                {r.email && <> · <a href={`mailto:${r.email}`} className="text-gold-700 hover:underline">{r.email}</a></>}
              </p>
              <p className="mt-1 text-xs text-ink-400">{formatDate(r.createdAt, true)}</p>
            </div>
            <div className="text-sm">
              <p>Взрослых: <b>{r.adults}</b> · детей: <b>{r.children}</b> · старших: <b>{r.seniors}</b></p>
              {r.zones.length > 0 && <p className="mt-1 text-xs text-ink-500">{r.zones.join(', ')}</p>}
              {r.comment && <p className="mt-2 rounded-xl bg-cream-100 px-3 py-2 text-xs">{r.comment}</p>}
            </div>
            <form action={updateRegistrationAction} className="grid gap-2">
              <input type="hidden" name="id" value={r.id} />
              <textarea name="adminNote" defaultValue={r.adminNote ?? ''} rows={2} placeholder="Заметка" className="input py-2 text-sm" />
              <button className="btn-ghost btn-sm w-fit">Сохранить заметку</button>
            </form>
            <div className="flex items-center gap-2">
              <AutoSubmitSelect action={updateRegistrationAction} id={r.id} name="status" value={r.status} options={ST.map((s) => ({ v: s, l: REG_STATUS_LABEL[s] }))} />
              <form action={deleteRegistrationAction}>
                <input type="hidden" name="id" value={r.id} />
                <ConfirmButton message="Удалить заявку?" className="grid h-9 w-9 place-items-center rounded-xl text-ink-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 className="h-4 w-4" /></ConfirmButton>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

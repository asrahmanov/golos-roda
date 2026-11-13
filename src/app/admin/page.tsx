import Link from 'next/link';
import { Activity, BookHeart, CalendarCheck, FileText, Handshake, Image as ImageIcon, LifeBuoy, Mic, PenLine, TreePine, UserPlus, Users, Video } from 'lucide-react';
import { db } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { TREE_MIN_PERSONS } from '@/lib/stats';
import { plural } from '@/lib/utils';

function dayKey(d: Date) {
  return d.toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow', day: '2-digit', month: '2-digit' });
}

function Kpi({ label, value, target, I, hint }: { label: string; value: number; target: number; I: typeof Users; hint: string }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, target)) * 100));
  return (
    <div className="relative overflow-hidden rounded-3xl bg-ink-900 p-6 text-cream-50 sm:p-8">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold-500/20 blur-3xl" />
      <div className="relative flex items-center justify-between">
        <I className="h-7 w-7 text-gold-400" />
        <span className="chip bg-white/10 text-gold-300">{pct}% цели</span>
      </div>
      <p className="relative mt-6 font-serif text-6xl font-semibold">
        {value}
        <span className="text-2xl text-cream-100/40"> / {target}</span>
      </p>
      <p className="relative mt-1 font-semibold">{label}</p>
      <div className="relative mt-5 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-300" style={{ width: `${pct}%` }} />
      </div>
      <p className="relative mt-3 text-xs text-cream-100/50">{hint}</p>
    </div>
  );
}

function Stat({ label, value, I, href }: { label: string; value: number | string; I: typeof Users; href?: string }) {
  const inner = (
    <>
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold-500/15 text-gold-700"><I className="h-5 w-5" /></span>
      <p className="mt-4 font-serif text-3xl font-semibold">{value}</p>
      <p className="text-sm text-ink-500">{label}</p>
    </>
  );
  return href ? (
    <Link href={href} className="card block p-5 transition hover:-translate-y-0.5 hover:shadow-xl">{inner}</Link>
  ) : (
    <div className="card p-5">{inner}</div>
  );
}

export default async function AdminDashboard() {
  const since = new Date(Date.now() - 30 * 86400000);
  const [s, families, users, persons, matByType, comments, members, regAgg, regCount, reqNew, storiesPending, ticketsNew, activeFamilies, recentUsers, recentFamilies, recentMaterials, recentRegs, completions] =
    await Promise.all([
      getSettings(),
      db.family.findMany({ select: { id: true, _count: { select: { persons: true, relations: true, members: true } } } }),
      db.user.count(),
      db.person.count(),
      db.material.groupBy({ by: ['type'], _count: true }),
      db.comment.count(),
      db.membership.count({ where: { role: { not: 'OWNER' } } }),
      db.festivalRegistration.aggregate({ where: { status: { not: 'CANCELLED' } }, _sum: { adults: true, children: true, seniors: true } }),
      db.festivalRegistration.count({ where: { status: { not: 'CANCELLED' } } }),
      db.partnerRequest.count({ where: { status: 'NEW' } }),
      db.publicStory.count({ where: { status: 'PENDING' } }),
      db.supportTicket.count({ where: { status: 'NEW' } }),
      db.activity.groupBy({ by: ['familyId'], where: { createdAt: { gte: since } } }),
      db.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      db.family.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      db.material.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      db.festivalRegistration.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      db.taskCompletion.count(),
    ]);

  const participating = families.filter((f) => f._count.persons > 0).length;
  const trees = families.filter((f) => f._count.persons >= TREE_MIN_PERSONS && f._count.relations > 0).length;
  const m = (t: string) => matByType.find((x) => x.type === t)?._count ?? 0;
  const people = (regAgg._sum.adults ?? 0) + (regAgg._sum.children ?? 0) + (regAgg._sum.seniors ?? 0);

  const days: string[] = [];
  for (let i = 29; i >= 0; i--) days.push(dayKey(new Date(Date.now() - i * 86400000)));
  const series = [
    { name: 'Регистрации пользователей', color: '#c2a057', data: recentUsers },
    { name: 'Новые семьи', color: '#11211a', data: recentFamilies },
    { name: 'Материалы', color: '#7d8b6a', data: recentMaterials },
    { name: 'Заявки на фестиваль', color: '#b8695a', data: recentRegs },
  ].map((sr) => {
    const counts = new Map<string, number>();
    for (const r of sr.data) counts.set(dayKey(r.createdAt), (counts.get(dayKey(r.createdAt)) ?? 0) + 1);
    return { ...sr, values: days.map((d) => counts.get(d) ?? 0) };
  });
  const max = Math.max(1, ...series.flatMap((x) => x.values));
  const W = 600;
  const H = 180;

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Статистика запуска</p>
        <h1 className="h-display mt-2 text-4xl">Дашборд проекта</h1>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Kpi label="семей-участников" value={participating} target={Number(s.kpiFamiliesTarget) || 100} I={Users} hint="Семейное пространство, где добавлен хотя бы один родственник" />
        <Kpi label="семейных деревьев" value={trees} target={Number(s.kpiTreesTarget) || 50} I={TreePine} hint={`Пространство с ${TREE_MIN_PERSONS}+ родственниками и хотя бы одной связью`} />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
        <Stat label="пользователей" value={users} I={UserPlus} href="/admin/users" />
        <Stat label="пространств всего" value={families.length} I={Users} href="/admin/families" />
        <Stat label="карточек родственников" value={persons} I={TreePine} />
        <Stat label="приглашённых родственников" value={members} I={Users} />
        <Stat label="активных семей за 30 дней" value={activeFamilies.length} I={Activity} />
        <Stat label="выполнено заданий" value={completions} I={CalendarCheck} href="/admin/tasks" />
        <Stat label="фотографий" value={m('PHOTO')} I={ImageIcon} />
        <Stat label="документов" value={m('DOCUMENT')} I={FileText} />
        <Stat label="воспоминаний" value={m('MEMORY')} I={PenLine} />
        <Stat label="аудиозаписей" value={m('AUDIO')} I={Mic} />
        <Stat label="видео" value={m('VIDEO')} I={Video} />
        <Stat label="комментариев" value={comments} I={PenLine} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <section className="card p-6">
          <h2 className="font-serif text-xl font-semibold">Активность за 30 дней</h2>
          <svg viewBox={`0 0 ${W} ${H + 24}`} className="mt-5 w-full">
            {[0.25, 0.5, 0.75, 1].map((f) => (
              <line key={f} x1="0" x2={W} y1={H - H * f} y2={H - H * f} stroke="#11211a" strokeOpacity="0.06" />
            ))}
            {series.map((sr) => (
              <polyline
                key={sr.name}
                fill="none"
                stroke={sr.color}
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={sr.values.map((v, i) => `${(i / 29) * W},${H - (v / max) * (H - 10)}`).join(' ')}
              />
            ))}
            {days.map((d, i) => (i % 5 === 0 || i === 29 ? <text key={d} x={(i / 29) * W} y={H + 18} fontSize="10" fill="#7d8d84" textAnchor={i === 0 ? 'start' : i === 29 ? 'end' : 'middle'}>{d}</text> : null))}
          </svg>
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            {series.map((sr) => (
              <span key={sr.name} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: sr.color }} /> {sr.name}: <b>{sr.values.reduce((a, b) => a + b, 0)}</b></span>
            ))}
          </div>
        </section>
        <section className="grid gap-4">
          <Link href="/admin/registrations" className="card flex items-center gap-4 p-5 transition hover:shadow-xl">
            <CalendarCheck className="h-8 w-8 text-gold-600" />
            <div>
              <p className="font-serif text-2xl font-semibold">{regCount} {plural(regCount, ['семья', 'семьи', 'семей'])}</p>
              <p className="text-sm text-ink-500">зарегистрировано на фестиваль · {people} чел.</p>
            </div>
          </Link>
          <Link href="/admin/requests" className="card flex items-center gap-4 p-5 transition hover:shadow-xl">
            <Handshake className="h-8 w-8 text-gold-600" />
            <div><p className="font-serif text-2xl font-semibold">{reqNew}</p><p className="text-sm text-ink-500">новых заявок партнёров</p></div>
          </Link>
          <Link href="/admin/stories" className="card flex items-center gap-4 p-5 transition hover:shadow-xl">
            <BookHeart className="h-8 w-8 text-gold-600" />
            <div><p className="font-serif text-2xl font-semibold">{storiesPending}</p><p className="text-sm text-ink-500">историй ждут модерации</p></div>
          </Link>
          <Link href="/admin/support" className="card flex items-center gap-4 p-5 transition hover:shadow-xl">
            <LifeBuoy className="h-8 w-8 text-gold-600" />
            <div><p className="font-serif text-2xl font-semibold">{ticketsNew}</p><p className="text-sm text-ink-500">новых обращений в поддержку</p></div>
          </Link>
        </section>
      </div>
      <p className="text-xs text-ink-400">
        Администраторы видят только агрегированную статистику. Содержимое семейных пространств (карточки, фото, воспоминания) доступно лишь приглашённым участникам семьи.
      </p>
    </div>
  );
}

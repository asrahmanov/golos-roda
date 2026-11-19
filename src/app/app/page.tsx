import Link from 'next/link';
import { ArrowRight, BookHeart, Images, PartyPopper, Plus, TreePine, UploadCloud, Users } from 'lucide-react';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { ROLE_LABEL } from '@/lib/family';
import { plural, timeAgo } from '@/lib/utils';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Motion';
import { TaskIcon } from '@/components/ui/TaskIcon';
import { CreateFamilyForm } from '@/components/app/CreateFamilyForm';

export default async function AppHome({ searchParams }: { searchParams: Promise<{ welcome?: string; deleted?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const memberships = await db.membership.findMany({
    where: { userId: user.id },
    include: {
      family: {
        include: {
          _count: { select: { persons: true, materials: true, members: true } },
          activities: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  const tasks = await db.task.findMany({ where: { isPublished: true }, orderBy: [{ order: 'asc' }, { startsAt: 'desc' }], take: 3 });
  const lastName = user.name.split(' ')[1];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {sp.welcome && (
        <Reveal className="mb-8 flex items-start gap-4 rounded-3xl bg-ink-900 p-6 text-cream-50">
          <PartyPopper className="h-8 w-8 shrink-0 text-gold-400" />
          <div>
            <p className="font-serif text-2xl font-semibold">Добро пожаловать, {user.name.split(' ')[0]}!</p>
            <p className="mt-1 text-cream-100/70">Создайте семейное пространство — это займёт минуту. Затем добавьте родственников и пригласите близких.</p>
          </div>
        </Reveal>
      )}
      {sp.deleted && <div className="mb-6 rounded-2xl bg-sage-500/12 px-5 py-3 text-sm text-sage-500">Семейное пространство удалено.</div>}

      <Reveal>
        <p className="eyebrow">Личный кабинет</p>
        <h1 className="h-display mt-3 text-4xl sm:text-5xl">{memberships.length ? 'Ваши семьи' : 'Начнём вашу летопись'}</h1>
      </Reveal>

      {memberships.length === 0 ? (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <Reveal className="card p-6 sm:p-10">
            <CreateFamilyForm defaultLastName={lastName} />
            <p className="mt-6 border-t border-ink-900/8 pt-5 text-sm text-ink-500">
              Есть архив семьи или готовое дерево в файле?{' '}
              <Link href="/app/import" className="font-semibold text-gold-700 hover:underline">Загрузите его</Link>
            </p>
          </Reveal>
          <Reveal delay={0.1} className="space-y-4">
            {[
              { I: TreePine, t: 'Постройте дерево', d: 'Добавьте себя, родителей, бабушек и дедушек. Связи можно уточнять постепенно.' },
              { I: Images, t: 'Соберите архив', d: 'Фото, документы, аудио и воспоминания — в карточках конкретных людей.' },
              { I: Users, t: 'Пригласите семью', d: 'Отправьте ссылку родным — вместе вспомнить проще.' },
            ].map((s, i) => (
              <div key={s.t} className="flex gap-4 rounded-3xl bg-cream-100 p-6">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ink-900 text-gold-400">
                  <s.I className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-bold">{i + 1}. {s.t}</p>
                  <p className="mt-1 text-sm text-ink-600">{s.d}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      ) : (
        <Stagger className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {memberships.map(({ family, role }) => (
            <StaggerItem key={family.id}>
              <Link href={`/app/family/${family.id}`} className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-ink-900 p-7 text-cream-50 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
                <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold-500/20 blur-3xl transition-all duration-700 group-hover:scale-150" />
                <span className="chip relative w-fit bg-white/10 text-gold-300">{ROLE_LABEL[role]}</span>
                <h2 className="relative mt-6 font-serif text-3xl font-semibold leading-tight">{family.name}</h2>
                {family.description && <p className="relative mt-2 line-clamp-2 text-sm text-cream-100/60">{family.description}</p>}
                <div className="relative mt-auto grid grid-cols-3 gap-2 pt-8 text-center">
                  {[
                    { v: family._count.persons, l: plural(family._count.persons, ['человек', 'человека', 'человек']) },
                    { v: family._count.materials, l: plural(family._count.materials, ['материал', 'материала', 'материалов']) },
                    { v: family._count.members, l: plural(family._count.members, ['участник', 'участника', 'участников']) },
                  ].map((x) => (
                    <div key={x.l} className="rounded-2xl bg-white/5 py-3">
                      <div className="font-serif text-2xl font-semibold">{x.v}</div>
                      <div className="text-[11px] text-cream-100/50">{x.l}</div>
                    </div>
                  ))}
                </div>
                {family.activities[0] && <p className="relative mt-4 text-xs text-cream-100/40">Обновлено {timeAgo(family.activities[0].createdAt)}</p>}
              </Link>
            </StaggerItem>
          ))}
          <StaggerItem>
            <Link href="/app/new" className="group grid h-full min-h-[16rem] place-items-center rounded-3xl border-2 border-dashed border-ink-900/15 p-7 text-center transition hover:border-gold-500 hover:bg-gold-500/5">
              <span>
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-cream-200 text-ink-600 transition group-hover:rotate-90 group-hover:bg-gold-500 group-hover:text-ink-950">
                  <Plus className="h-6 w-6" />
                </span>
                <span className="mt-4 block font-semibold">Новое семейное пространство</span>
                <span className="mt-1 block text-sm text-ink-500">например, по другой линии рода</span>              </span>
            </Link>
          </StaggerItem>
          <StaggerItem>
            <Link href="/app/import" className="group flex h-full min-h-[16rem] flex-col justify-center rounded-3xl bg-cream-100 p-7 transition hover:bg-cream-200">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-ink-600 transition group-hover:bg-ink-900 group-hover:text-gold-300">
                <UploadCloud className="h-6 w-6" />
              </span>
              <span className="mt-4 block font-semibold">Загрузить архив или дерево</span>
              <span className="mt-1 block text-sm text-ink-500">ZIP-архив, скачанный с сайта, или JSON-файл дерева — например, подготовленный ИИ по фото схемы</span>
            </Link>
          </StaggerItem>
        </Stagger>
      )}

      {tasks.length > 0 && memberships.length > 0 && (
        <section className="mt-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Социальная программа</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold">Задания месяца</h2>
            </div>
            <Link href={`/app/family/${memberships[0].family.id}/tasks`} className="hidden items-center gap-1 text-sm font-semibold text-gold-700 hover:underline sm:flex">
              Все задания <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {tasks.map((t) => (
              <Link key={t.id} href={`/app/family/${memberships[0].family.id}/tasks#${t.id}`} className="card group p-6 transition hover:-translate-y-0.5 hover:shadow-xl">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cream-100 text-ink-900 transition duration-500 group-hover:bg-ink-900 group-hover:text-cream-50">
                  <TaskIcon name={t.icon} className="h-8 w-8" />
                </span>
                <h3 className="mt-4 font-bold">{t.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-ink-500">{t.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-16 grid gap-4 sm:grid-cols-2">
        <Link href="/stories" className="flex items-center gap-4 rounded-3xl bg-cream-100 p-6 transition hover:bg-cream-200">
          <BookHeart className="h-8 w-8 text-gold-600" />
          <div>
            <p className="font-bold">Истории других семей</p>
            <p className="text-sm text-ink-500">Вдохновитесь на собственный поиск</p>
          </div>
        </Link>
        <Link href="/festival" className="flex items-center gap-4 rounded-3xl bg-cream-100 p-6 transition hover:bg-cream-200">
          <PartyPopper className="h-8 w-8 text-gold-600" />
          <div>
            <p className="font-bold">Семейный фестиваль</p>
            <p className="text-sm text-ink-500">Оцифруем фото и запишем воспоминания вместе</p>
          </div>
        </Link>
      </section>
    </div>
  );
}

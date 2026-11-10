import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { db } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { getPublicStats } from '@/lib/stats';
import { fileUrl } from '@/lib/storage';
import { FESTIVAL_ZONES } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { Hero } from '@/components/site/Hero';
import { TreeDemo } from '@/components/site/TreeDemo';
import { Faq } from '@/components/site/Faq';
import { SectionHead } from '@/components/site/Section';
import { Counter, DrawLine, MaskReveal, Ornament, Parallax, ProgressBar, Reveal, Stagger, StaggerItem } from '@/components/ui/Motion';
import { BrandIcon, type BrandIconName } from '@/components/ui/BrandIcon';
import { Marquee } from '@/components/site/Marquee';
import { TaskIcon } from '@/components/ui/TaskIcon';

const ZONE_ICON: Record<string, BrandIconName> = { tree: 'tree', mic: 'mic', archive: 'archive', search: 'roots', book: 'book' };

export default async function HomePage() {
  const [s, stats, tasks, program, faq, stories, partners, news] = await Promise.all([
    getSettings(),
    getPublicStats(),
    db.task.findMany({ where: { isPublished: true }, orderBy: [{ order: 'asc' }, { startsAt: 'desc' }], take: 4 }),
    db.programItem.findMany({ orderBy: { order: 'asc' } }),
    db.faqItem.findMany({ where: { published: true }, orderBy: { order: 'asc' } }),
    db.publicStory.findMany({ where: { status: 'APPROVED' }, orderBy: { publishedAt: 'desc' }, take: 3 }),
    db.partner.findMany({ where: { published: true }, orderBy: { order: 'asc' } }),
    db.news.findMany({ where: { published: true }, orderBy: { publishedAt: 'desc' }, take: 3 }),
  ]);
  const famTarget = Number(s.kpiFamiliesTarget) || 100;
  const treeTarget = Number(s.kpiTreesTarget) || 50;

  return (
    <>
      <Hero
        eyebrow={s.heroEyebrow}
        title={s.heroTitle}
        subtitle={s.heroSubtitle}
        festivalDate={s.festivalDate}
        festivalDateText={s.festivalDateText}
      />

      {/* Проблема */}
      <section className="relative py-24 sm:py-32">
        <div className="container-x">
          <SectionHead
            eyebrow="Почему это важно"
            title={<>У каждой семьи есть история. <span className="text-gold-600">Но не каждая история сохраняется.</span></>}
            lead="Голос близкого человека, фотографии, письма, воспоминания — бесценное наследие, которое можно потерять навсегда."
          />
          <Stagger className="mt-16 grid gap-5 md:grid-cols-3">
            {[
              { n: '01', t: 'Истории исчезают', d: 'Воспоминания часто остаются только в памяти старшего поколения.', I: 'voice-fade' as const },
              { n: '02', t: 'Архивы разрозненны', d: 'Документы и фотографии хранятся у разных родственников и на разных устройствах.', I: 'scatter' as const },
              { n: '03', t: 'Связь ослабевает', d: 'Нам не всегда хватает повода, чтобы спросить родных об их жизни и корнях.', I: 'infinity-broken' as const },
            ].map((c) => (
              <StaggerItem key={c.n} className="card spotlight group relative overflow-hidden p-8 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl">
                <span className="text-outline absolute right-6 top-5 font-serif text-[5rem] font-bold leading-none text-gold-400/50 transition-colors duration-500 group-hover:text-gold-500">
                  {c.n}
                </span>
                <span className="relative grid h-20 w-20 place-items-center rounded-[1.4rem] bg-cream-100 text-ink-900 transition-all duration-500 group-hover:-rotate-3 group-hover:bg-ink-900 group-hover:text-cream-50">
                  <BrandIcon name={c.I} className="h-12 w-12" />
                </span>
                <h3 className="relative mt-8 font-serif text-2xl font-semibold">{c.t}</h3>
                <p className="relative mt-3 leading-relaxed text-ink-600">{c.d}</p>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal className="mt-14 text-center">
            <p className="mx-auto max-w-2xl font-serif text-2xl italic text-ink-700 sm:text-3xl">
              Мы хотим дать каждой семье простой способ сохранить свою историю — <span className="text-gold-600">вместе</span>.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Миссия */}
      <section id="mission" className="relative overflow-hidden bg-ink-900 py-24 text-cream-50 sm:py-32">
        <div className="grain pointer-events-none absolute inset-0 opacity-[0.06]" />
        <div className="container-x relative grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHead dark eyebrow="Миссия проекта" title={<>Три смысла.<br />Одна история.</>} />
            <div className="mt-12 space-y-8">
              {[
                { t: 'Сохранение памяти', d: 'Сберечь голоса, лица и истории близких.' },
                { t: 'Объединение поколений', d: 'Дать повод говорить, слушать и узнавать друг друга.' },
                { t: 'Наследие будущему', d: 'Передать семейную летопись детям, внукам и правнукам.' },
              ].map((m, i) => (
                <Reveal key={m.t} delay={0.1 * i} className="flex gap-6">
                  <span className="font-serif text-2xl text-gold-400">0{i + 1}</span>
                  <div className="border-b border-white/10 pb-8">
                    <h3 className="text-xl font-bold">{m.t}</h3>
                    <p className="mt-2 text-cream-100/65">{m.d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
          <Reveal>
            <MaskReveal className="relative aspect-[4/5] overflow-hidden rounded-[2rem] ring-1 ring-white/10 sm:aspect-[5/4] lg:aspect-[4/5]">
              <Parallax offset={40} className="relative h-full w-full">
                <Image src="/img/hands.jpg" alt="Рука взрослого держит руку ребёнка" fill className="scale-110 object-cover" sizes="(min-width:1024px) 50vw, 100vw" />
              </Parallax>
            </MaskReveal>
          </Reveal>
        </div>
      </section>

      <Marquee dark words={['Память', 'Голос', 'Семья', 'Корни', 'Наследие', 'Связь']} />

      {/* Платформа */}
      <section id="platform" className="py-24 sm:py-32">
        <div className="container-x grid items-center gap-16 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <SectionHead
              eyebrow="Что мы создаём"
              title={<>Не просто родословная. <span className="text-gold-600">Живая история семьи.</span></>}
              lead="Цифровая платформа, которую родственники пополняют вместе и передают следующим поколениям. Каждая семья получает своё закрытое пространство."
            />
            <Reveal delay={0.2} className="mt-10 flex flex-wrap gap-3">
              <Link href="/register" className="btn-dark group">
                Создать семейное пространство <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>
          <Reveal>
            <TreeDemo />
          </Reveal>
        </div>
        <div className="container-x mt-20">
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { I: 'tree' as const, t: 'Генеалогическое дерево', d: 'Имена, даты и семейные связи — структура растёт по мере появления сведений.' },
              { I: 'cameo' as const, t: 'Карточки родственников', d: 'Биография, места жизни, профессия и все связанные истории человека.' },
              { I: 'archive' as const, t: 'Семейный архив', d: 'Фотографии, документы, аудио, видео и воспоминания в привязке к людям.' },
              { I: 'together' as const, t: 'Совместная работа', d: 'Приглашайте близких: читать, дополнять, комментировать и уточнять.' },
              { I: 'privacy' as const, t: 'Приватность', d: 'Ничего не публикуется по умолчанию. Доступ — по правилам вашей семьи.' },
            ].map((f) => (
              <StaggerItem key={f.t} className="spotlight group rounded-3xl border border-ink-900/8 bg-cream-100/60 p-6 transition-all duration-500 hover:-translate-y-1 hover:border-gold-400/50 hover:bg-white hover:shadow-xl">
                <span className="grid h-[4.5rem] w-[4.5rem] place-items-center rounded-[1.3rem] bg-ink-900 text-cream-50 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105">
                  <BrandIcon name={f.I} accent="#e3b77e" className="h-12 w-12" />
                </span>
                <h3 className="mt-6 text-lg font-bold leading-snug">{f.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{f.d}</p>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal className="mt-8 flex items-center gap-3 text-sm text-ink-500">
            <BrandIcon name="spark" draw={false} className="h-6 w-6 shrink-0 text-gold-600" />
            Следующие этапы развития — карта географии рода, архивный поиск и инструменты ИИ — появятся у будущего оператора платформы.
          </Reveal>
        </div>
      </section>

      {/* Путь участника */}
      <section className="bg-cream-100 py-24 sm:py-32">
        <div className="container-x">
          <SectionHead center eyebrow="Как это работает" title="Пять шагов к семейной летописи" lead="Начать может один человек — а затем пригласить остальных. Пополнять архив можно в своём темпе." />
          <div className="relative mt-16">
            <DrawLine vertical className="absolute left-6 top-0 h-full w-px bg-gradient-to-b from-gold-400 via-gold-400/40 to-transparent md:hidden" />
            <DrawLine className="absolute left-0 top-7 hidden h-px w-full bg-gradient-to-r from-gold-400 via-gold-400/50 to-transparent md:block" />
            <Stagger className="grid gap-8 md:grid-cols-5 md:gap-6" gap={0.12}>
              {[
                { t: 'Знакомство', d: 'Узнаёте о проекте на фестивале или на сайте.', r: 'Понимание, зачем сохранять историю' },
                { t: 'Первое дерево', d: 'Добавляете родственников и связи между ними.', r: 'Наглядная основа родословной' },
                { t: 'Первая история', d: 'Прикрепляете фото, документ или воспоминание.', r: 'Начало живого архива' },
                { t: 'Приглашение', d: 'Подключаете родственников по ссылке.', r: 'Сведения дополняются вместе' },
                { t: 'Продолжение', d: 'Возвращаетесь к архиву и цифровым заданиям.', r: 'Летопись растёт' },
              ].map((step, i) => (
                <StaggerItem key={step.t} className="relative pl-16 md:pl-0">
                  <span className="absolute left-0 top-0 grid h-12 w-12 place-items-center rounded-full bg-ink-900 font-serif text-lg font-semibold text-gold-300 ring-8 ring-cream-100 md:relative md:h-14 md:w-14">
                    {i + 1}
                  </span>
                  <h3 className="text-lg font-bold md:mt-6">{step.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">{step.d}</p>
                  <p className="mt-3 text-xs font-semibold text-gold-700">→ {step.r}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      {/* Задания */}
      {tasks.length > 0 && (
        <section className="py-24 sm:py-32">
          <div className="container-x">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <SectionHead
                eyebrow="Социальная программа"
                title="Цифровые семейные задания"
                lead="Добровольные задания раз в месяц — повод позвонить бабушке, открыть старый альбом и записать то, что важно."
              />
              <Reveal>
                <Link href="/register" className="btn-ghost shrink-0">Участвовать</Link>
              </Reveal>
            </div>
            <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {tasks.map((t, i) => (
                <StaggerItem
                  key={t.id}
                  className={`group relative overflow-hidden rounded-3xl p-7 transition-all duration-500 hover:-translate-y-1.5 ${
                    i % 2 === 0 ? 'bg-ink-900 text-cream-50' : 'bg-gold-500 text-ink-950'
                  }`}
                >
                  <TaskIcon name={t.icon} accent={i % 2 === 0 ? '#e3b77e' : '#1d1915'} className="h-14 w-14" />
                  <h3 className="mt-10 font-serif text-2xl font-semibold leading-tight">{t.title}</h3>
                  <p className="mt-3 line-clamp-4 text-sm leading-relaxed opacity-75">{t.description}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      {/* Фестиваль */}
      <section id="festival" className="relative overflow-hidden bg-ink-950 py-24 text-cream-50 sm:py-32">
        <div className="pointer-events-none absolute right-0 top-0 h-[40rem] w-[40rem] rounded-full bg-gold-500/10 blur-[140px]" />
        <div className="container-x relative">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <SectionHead
              dark
              eyebrow={`${s.festivalDateText} · Москва`}
              title={<>Фестиваль, с которого <span className="text-gold-400">начинается история</span></>}
              lead="Каждая семья не только узнает о проекте, но и сделает первый практический шаг: начнёт родословную, оцифрует документ, запишет воспоминание."
            />
            <Reveal className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link href="/festival#register" className="btn-gold px-7 py-4">Зарегистрировать семью</Link>
              <Link href="/festival" className="btn-ghost px-7 py-4 text-cream-50">Программа</Link>
            </Reveal>
          </div>
          <Stagger className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {FESTIVAL_ZONES.map((z) => {
              const I = ZONE_ICON[z.icon];
              return (
                <StaggerItem key={z.name} className="spotlight group rounded-3xl bg-white/[0.04] p-6 ring-1 ring-white/10 transition-all duration-500 hover:bg-white/[0.08] hover:ring-gold-400/40">
                  <BrandIcon name={I} accent="#e3b77e" className="h-12 w-12 text-cream-50" />
                  <h3 className="mt-6 font-serif text-xl font-semibold leading-snug">«{z.name}»</h3>
                  <p className="mt-2 text-sm leading-relaxed text-cream-100/60">{z.what}</p>
                  <p className="mt-4 text-xs font-semibold text-gold-300">✦ {z.result}</p>
                </StaggerItem>
              );
            })}
          </Stagger>
          {program.length > 0 && (
            <Reveal className="mt-14 rounded-3xl bg-white/[0.03] p-6 ring-1 ring-white/10 sm:p-10">
              <h3 className="font-serif text-2xl font-semibold">Программа дня</h3>
              <ol className="mt-6 divide-y divide-white/8">
                {program.slice(0, 6).map((p) => (
                  <li key={p.id} className="grid gap-1 py-4 sm:grid-cols-[8rem_1fr] sm:gap-6">
                    <span className="font-semibold tabular-nums text-gold-300">{p.time}</span>
                    <span>
                      <span className="font-semibold">{p.title}</span>
                      {p.description && <span className="mt-1 block text-sm text-cream-100/55">{p.description}</span>}
                    </span>
                  </li>
                ))}
              </ol>
            </Reveal>
          )}
        </div>
      </section>

      {/* Скульптура */}
      <section id="sculpture" className="relative overflow-hidden py-24 sm:py-32">
        <div className="container-x grid items-center gap-14 lg:grid-cols-2">
          <Reveal className="order-2 lg:order-1">
            <MaskReveal from="left" className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-2xl">
              <Parallax offset={50} className="relative h-full w-full">
                <Image src="/img/sculpture-2.jpg" alt="Концептуальный эскиз скульптуры в форме бесконечности" fill className="scale-110 object-cover" sizes="(min-width:1024px) 50vw, 100vw" />
              </Parallax>
            </MaskReveal>
            <p className="mt-3 text-xs text-ink-400">Концептуальный эскиз. Материалы, размеры и место установки подлежат согласованию.</p>
          </Reveal>
          <div className="order-1 lg:order-2">
            <SectionHead
              eyebrow="Арт-объект"
              title="Бесконечность, в которой встречаются руки"
              lead="Горизонтальная восьмёрка, внутри которой руки старшего и младшего поколений соприкасаются в центральной точке. Перфорированный металл, массивное деревянное основание, высота около 2,5 метра."
            />
            <Reveal delay={0.2} className="mt-8 grid grid-cols-3 gap-3">
              {[
                { v: '∞', l: 'непрерывность связей' },
                { v: '2,5 м', l: 'ориентир высоты' },
                { v: '22.11', l: 'открытие на фестивале' },
              ].map((x) => (
                <div key={x.l} className="rounded-2xl bg-cream-100 p-4">
                  <div className="font-serif text-2xl font-semibold text-gold-600 sm:text-3xl">{x.v}</div>
                  <div className="mt-1 text-xs text-ink-500">{x.l}</div>
                </div>
              ))}
            </Reveal>
            <Reveal delay={0.3}>
              <p className="mt-6 text-sm leading-relaxed text-ink-500">
                Скульптура — материальный символ открытия. Она остаётся в городе после фестиваля, но не заменяет главное — цифровую платформу и социальную программу.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* KPI */}
      <section className="bg-cream-100 py-24 sm:py-28">
        <div className="container-x">
          <SectionHead center eyebrow="Измеримый старт" title="Помогите превратить идею в действующий проект" />
          <div className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-2">
            {[
              { v: stats.families, t: famTarget, l: 'семей-участников', I: 'family' as const },
              { v: stats.trees, t: treeTarget, l: 'семейных деревьев', I: 'oak' as const },
            ].map((k) => (
              <Reveal key={k.l} className="card p-8 sm:p-10">
                <div className="flex items-start justify-between">
                  <BrandIcon name={k.I} className="h-14 w-14 text-ink-900" />
                  <span className="chip bg-gold-500/12 text-gold-700">цель: {k.t}</span>
                </div>
                <div className="mt-8 font-serif text-6xl font-semibold sm:text-7xl">
                  {s.showLiveStats === 'true' ? <Counter to={k.v} /> : k.t}
                  {s.showLiveStats === 'true' && <span className="text-3xl text-ink-300"> / {k.t}</span>}
                </div>
                <p className="mt-2 text-ink-600">{k.l}</p>
                {s.showLiveStats === 'true' && <ProgressBar value={k.v} max={k.t} className="mt-6 text-ink-900" />}
              </Reveal>
            ))}
          </div>
          {s.showLiveStats === 'true' && (
            <Reveal className="mx-auto mt-5 grid max-w-5xl grid-cols-2 gap-5">
              <div className="rounded-3xl bg-white/60 p-6 text-center">
                <div className="font-serif text-4xl font-semibold"><Counter to={stats.persons} /></div>
                <div className="mt-1 text-sm text-ink-500">родственников в деревьях</div>
              </div>
              <div className="rounded-3xl bg-white/60 p-6 text-center">
                <div className="font-serif text-4xl font-semibold"><Counter to={stats.stories} /></div>
                <div className="mt-1 text-sm text-ink-500">сохранённых воспоминаний</div>
              </div>
            </Reveal>
          )}
          <Reveal className="mt-8 text-center text-sm text-ink-500">{s.budgetText}</Reveal>
        </div>
      </section>

      {/* Истории */}
      {stories.length > 0 && (
        <section className="py-24 sm:py-32">
          <div className="container-x">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <SectionHead eyebrow="Истории, которые нас объединяют" title="Голоса семей" lead="Истории публикуются только с согласия авторов." />
              <Reveal><Link href="/stories" className="btn-ghost">Все истории</Link></Reveal>
            </div>
            <Stagger className="mt-14 grid gap-6 md:grid-cols-3">
              {stories.map((st) => (
                <StaggerItem key={st.id}>
                  <Link href={`/stories/${st.id}`} className="group block h-full overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-ink-900/8 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
                    <div className="relative aspect-[4/3] overflow-hidden bg-ink-900">
                      {st.imageId ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={fileUrl(st.imageId, true)!} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                        <div className="grid h-full place-items-center font-serif text-6xl text-gold-400/50">“</div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="font-serif text-xl font-semibold leading-snug">{st.title}</h3>
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-600">{st.text}</p>
                      <p className="mt-4 text-xs font-semibold text-gold-700">{st.authorName}</p>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      {/* Дорожная карта */}
      <section id="roadmap" className="relative overflow-hidden bg-ink-900 py-24 text-cream-50 sm:py-32">
        <div className="container-x">
          <SectionHead dark eyebrow="Практическая карта запуска" title="От идеи до работающего проекта" />
          <div className="mt-16 grid gap-px overflow-hidden rounded-3xl bg-white/10 md:grid-cols-4">
            {[
              { d: '9–13 ноября', t: 'Подготовка', x: 'Роли, концепция, поиск площадки и будущего оператора, сравнение технических решений, старт сбора средств.' },
              { d: '14–21 ноября', t: 'Настройка', x: 'Пилотная платформа и тестирование, приглашение семей и волонтёров, подготовка зон и выставки.' },
              { d: '22 ноября', t: 'Фестиваль', x: 'Презентация проекта, первые деревья, оцифровка, запись воспоминаний и открытие скульптуры.', hl: true },
              { d: 'до 28 ноября', t: 'Полный запуск', x: 'Рабочий пилот, цифровые задания, отчёт по показателям и согласованные условия передачи оператору.' },
            ].map((r, i) => (
              <Reveal key={r.d} delay={i * 0.1} className={`p-8 ${r.hl ? 'bg-gold-500 text-ink-950' : 'bg-ink-900'}`}>
                <p className={`text-sm font-bold ${r.hl ? '' : 'text-gold-400'}`}>{r.d}</p>
                <h3 className="mt-4 font-serif text-2xl font-semibold">{r.t}</h3>
                <p className={`mt-3 text-sm leading-relaxed ${r.hl ? 'text-ink-900/80' : 'text-cream-100/60'}`}>{r.x}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Поддержка */}
      <section className="py-24 sm:py-32">
        <div className="container-x grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHead
              eyebrow="Ваша помощь станет частью истории"
              title="Сохраним голоса, которые важны"
              lead="Партнёрство — это не только деньги. Пространство, техника, экспертиза или информационная поддержка тоже приближают запуск."
            />
            <Stagger className="mt-10 grid gap-3">
              {[
                { I: 'donate' as const, t: 'Пожертвование', d: 'Помочь финансировать запуск фестиваля и платформы', k: 'DONATION' },
                { I: 'venue' as const, t: 'Площадка и ресурсы', d: 'Предоставить пространство, технику, услуги', k: 'VENUE' },
                { I: 'craft' as const, t: 'Профессиональное участие', d: 'IT, генеалогия, фото и видео, волонтёрство', k: 'PROFESSIONAL' },
                { I: 'operator' as const, t: 'Стать оператором', d: 'Принять проект на долгосрочное развитие', k: 'OPERATOR' },
              ].map((x) => (
                <StaggerItem key={x.t}>
                  <Link href={`/support?kind=${x.k}#form`} className="spotlight group flex items-center gap-5 rounded-2xl border border-ink-900/8 bg-white p-5 transition-all duration-300 hover:border-gold-400 hover:shadow-lg">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-cream-100 text-ink-900 transition-colors duration-500 group-hover:bg-ink-900 group-hover:text-cream-50">
                      <BrandIcon name={x.I} className="h-9 w-9" />
                    </span>
                    <span className="flex-1">
                      <span className="block font-bold">{x.t}</span>
                      <span className="block text-sm text-ink-500">{x.d}</span>
                    </span>
                    <ArrowRight className="h-5 w-5 text-ink-300 transition-all group-hover:translate-x-1 group-hover:text-gold-600" />
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
          <Reveal>
            <div className="relative">
              <MaskReveal from="right" className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-2xl">
                <Image src="/img/team.jpg" alt="Команда «Легенда»" fill className="object-cover" sizes="(min-width:1024px) 50vw, 100vw" />
              </MaskReveal>
              <div className="absolute -bottom-6 left-6 right-6 rounded-2xl bg-ink-900 p-5 text-cream-50 shadow-2xl sm:left-auto sm:right-8 sm:w-72">
                <p className="eyebrow">Команда «Легенда»</p>
                <p className="mt-2 text-sm text-cream-100/75">Участники тренинга «Парадокс» — запускаем проект и передаём его постоянному оператору.</p>
              </div>
            </div>
          </Reveal>
        </div>
        {partners.length > 0 && (
          <div className="container-x mt-24">
            <p className="eyebrow text-center">Партнёры проекта</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
              {partners.map((p) => {
                const inner = p.logoId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fileUrl(p.logoId)!} alt={p.name} className="h-12 w-auto max-w-[160px] object-contain opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0" />
                ) : (
                  <span className="font-serif text-xl font-semibold text-ink-500">{p.name}</span>
                );
                return p.url ? (
                  <a key={p.id} href={p.url} target="_blank" rel="noreferrer" title={p.name}>{inner}</a>
                ) : (
                  <span key={p.id} title={p.name}>{inner}</span>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Новости */}
      {news.length > 0 && (
        <section className="bg-cream-100 py-24">
          <div className="container-x">
            <div className="flex items-end justify-between gap-6">
              <SectionHead eyebrow="Новости" title="Что происходит в проекте" />
              <Link href="/news" className="btn-ghost hidden shrink-0 sm:inline-flex">Все новости</Link>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {news.map((n) => (
                <Reveal key={n.id}>
                  <Link href={`/news/${n.slug}`} className="group block">
                    <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-ink-900">
                      {n.coverId ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={fileUrl(n.coverId, true)!} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                        <div className="grid h-full place-items-center"><BrandIcon name="news" accent="#c58d4f" className="h-16 w-16 text-cream-50/40" /></div>
                      )}
                    </div>
                    <p className="mt-4 text-xs font-semibold text-gold-700">{formatDate(n.publishedAt)}</p>
                    <h3 className="mt-2 font-serif text-xl font-semibold leading-snug group-hover:text-gold-700">{n.title}</h3>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faq.length > 0 && (
        <section id="faq" className="py-24 sm:py-32">
          <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.6fr]">
            <SectionHead eyebrow="Вопросы и ответы" title="Что важно знать" lead="Не нашли ответ? Напишите нам — поможем разобраться." />
            <Reveal><Faq items={faq} /></Reveal>
          </div>
        </section>
      )}

      <Marquee reverse words={['Расспросите старших', 'Оцифруйте фото', 'Запишите голос', 'Пригласите родных']} className="border-y border-ink-900/8" />

      {/* CTA */}
      <section className="px-4 pb-20 sm:px-8">
        <Reveal className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-ink-900 px-6 py-20 text-center text-cream-50 sm:px-12 sm:py-28">
          <div className="grain pointer-events-none absolute inset-0 opacity-[0.07]" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/20 blur-[100px]" />
          <div className="relative">
            <Ornament dark className="mb-6" />
            <p className="eyebrow">Начните сегодня</p>
            <h2 className="h-display mx-auto mt-5 max-w-3xl text-[clamp(2.4rem,6vw,4.5rem)] text-balance">
              Пока близкие рядом — <span className="text-gold-400">запишите их истории</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-cream-100/70">Создание семейного пространства бесплатно и занимает пару минут.</p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/register" data-magnetic className="btn-gold px-8 py-4 text-[15px]">Создать семейное дерево</Link>
              <Link href="/festival#register" data-magnetic className="btn-ghost px-8 py-4 text-[15px] text-cream-50">Прийти на фестиваль</Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

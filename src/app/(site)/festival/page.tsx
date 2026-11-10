import type { Metadata } from 'next';
import Image from 'next/image';
import { Archive, BookOpen, CalendarDays, Clock, MapPin, Mic, Search, ShieldCheck, TreePine, Users } from 'lucide-react';
import { db } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { FESTIVAL_ZONES, FESTIVAL_ZONE_NAMES } from '@/lib/constants';
import { Countdown } from '@/components/site/Countdown';
import { FestivalForm } from '@/components/site/PublicForms';
import { SectionHead } from '@/components/site/Section';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Motion';

export const metadata: Metadata = {
  title: 'Семейный фестиваль 22 ноября',
  description: 'Семейный фестиваль «Связь поколений» в Москве: создайте семейное дерево, оцифруйте фото, запишите воспоминания. Регистрация семей.',
};

const ZONE_ICON = { tree: TreePine, mic: Mic, archive: Archive, search: Search, book: BookOpen } as const;

export default async function FestivalPage() {
  const [s, program] = await Promise.all([getSettings(), db.programItem.findMany({ orderBy: { order: 'asc' } })]);
  const open = s.registrationOpen === 'true';
  return (
    <>
      <section className="relative overflow-hidden bg-ink-900 text-cream-50">
        <div className="absolute inset-0 opacity-30">
          <Image src="/img/sculpture.jpg" alt="" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-ink-900 via-ink-900/90 to-ink-900/40" />
        <div className="container-x relative py-20 sm:py-28">
          <Reveal><p className="eyebrow">Публичный старт проекта</p></Reveal>
          <Reveal delay={0.1}>
            <h1 className="h-display mt-5 max-w-4xl text-[clamp(2.8rem,7vw,6rem)]">
              Семейный фестиваль <span className="text-gold-400">«Связь поколений»</span>
            </h1>
          </Reveal>
          <Reveal delay={0.2} className="mt-8 flex flex-wrap gap-3 text-sm">
            <span className="chip bg-white/10 px-4 py-2"><CalendarDays className="h-4 w-4 text-gold-400" /> {s.festivalDateText}</span>
            <span className="chip bg-white/10 px-4 py-2"><MapPin className="h-4 w-4 text-gold-400" /> {s.festivalVenue}{s.festivalAddress ? `, ${s.festivalAddress}` : ''}</span>
            <span className="chip bg-white/10 px-4 py-2"><Users className="h-4 w-4 text-gold-400" /> Вход свободный, для всей семьи</span>
          </Reveal>
          <Reveal delay={0.3} className="mt-10"><Countdown target={s.festivalDate} /></Reveal>
        </div>
      </section>

      <section className="py-24">
        <div className="container-x">
          <SectionHead
            eyebrow="Замысел"
            title="Не только сцена — практический шаг для каждой семьи"
            lead="Внутренние пространства для консультаций и записи историй плюс уличная церемония открытия скульптуры. Каждый посетитель уходит с осязаемым результатом."
          />
          <Stagger className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FESTIVAL_ZONES.map((z) => {
              const I = ZONE_ICON[z.icon];
              return (
                <StaggerItem key={z.name} className="card p-8">
                  <I className="h-8 w-8 text-gold-500" strokeWidth={1.5} />
                  <h3 className="mt-6 font-serif text-2xl font-semibold">«{z.name}»</h3>
                  <p className="mt-3 text-ink-600">{z.what}</p>
                  <p className="mt-5 border-t border-ink-900/8 pt-4 text-sm font-semibold text-gold-700">Семья получает: {z.result.toLowerCase()}</p>
                </StaggerItem>
              );
            })}
            <StaggerItem className="rounded-3xl bg-ink-900 p-8 text-cream-50">
              <ShieldCheck className="h-8 w-8 text-gold-400" strokeWidth={1.5} />
              <h3 className="mt-6 font-serif text-2xl font-semibold">Бережно к материалам</h3>
              <p className="mt-3 text-cream-100/70">
                Оригиналы документов остаются у владельцев. Записи и фото публикуются только с разрешения. Волонтёры не получают доступ к семейным архивам.
              </p>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {program.length > 0 && (
        <section className="bg-cream-100 py-24">
          <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.6fr]">
            <SectionHead eyebrow="Программа" title="Как пройдёт день" lead="Точное время и состав экспертов уточняются после подтверждения площадки." />
            <ol className="relative space-y-4 border-l border-gold-400/40 pl-8">
              {program.map((p, i) => (
                <Reveal as="li" key={p.id} delay={i * 0.05} className="relative">
                  <span className="absolute -left-[2.45rem] top-6 h-3 w-3 rounded-full bg-gold-500 ring-4 ring-cream-100" />
                  <div className="card p-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="chip bg-ink-900 text-gold-300"><Clock className="h-3.5 w-3.5" /> {p.time}</span>
                      {p.zone && <span className="chip bg-gold-500/12 text-gold-700">{p.zone}</span>}
                    </div>
                    <h3 className="mt-3 text-lg font-bold">{p.title}</h3>
                    {p.description && <p className="mt-1 text-ink-600">{p.description}</p>}
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section id="register" className="relative scroll-mt-24 overflow-hidden bg-ink-950 py-24 text-cream-50">
        <div className="pointer-events-none absolute -left-20 top-0 h-[30rem] w-[30rem] rounded-full bg-gold-500/10 blur-[120px]" />
        <div className="container-x relative grid gap-14 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <SectionHead dark eyebrow="Регистрация" title="Приходите всей семьёй" lead="Предварительная регистрация поможет нам подготовить волонтёров и оборудование. Мы напомним о фестивале ближе к дате." />
            <Reveal delay={0.2} className="mt-10 space-y-4 text-cream-100/70">
              <p className="flex gap-3"><span className="text-gold-400">✦</span> Возьмите семейные фотографии и документы — оцифруем на месте.</p>
              <p className="flex gap-3"><span className="text-gold-400">✦</span> Приводите старшее поколение — запишем их воспоминания.</p>
              <p className="flex gap-3"><span className="text-gold-400">✦</span> Волонтёры помогут зарегистрироваться на платформе и начать дерево.</p>
            </Reveal>
          </div>
          <Reveal className="rounded-[2rem] bg-white/[0.04] p-6 ring-1 ring-white/10 sm:p-10">
            {open ? (
              <FestivalForm zones={FESTIVAL_ZONE_NAMES} />
            ) : (
              <p className="py-10 text-center font-serif text-2xl">Регистрация сейчас закрыта. Следите за новостями!</p>
            )}
          </Reveal>
        </div>
      </section>
    </>
  );
}

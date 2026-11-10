import type { Metadata } from 'next';
import { BrandIcon } from '@/components/ui/BrandIcon';
import { getSettings } from '@/lib/settings';
import { fileUrl } from '@/lib/storage';
import { PartnerForm } from '@/components/site/PublicForms';
import { SectionHead } from '@/components/site/Section';
import { Reveal, Stagger, StaggerItem, TitleReveal } from '@/components/ui/Motion';

export const metadata: Metadata = {
  title: 'Поддержать проект',
  description: 'Как помочь проекту «Голос рода»: пожертвование, площадка, IT и профессиональное участие, информационная поддержка, принятие проекта оператором.',
};

const WAYS = [
  { I: 'donate' as const, t: 'Спонсору и донору', d: 'Денежный вклад в согласованную часть проекта или целевой сбор.', a: 'Сумма, цель, отчётность, условия упоминания' },
  { I: 'venue' as const, t: 'Владельцу площадки', d: 'Помещения, интернет, техника, доступ к уличной зоне.', a: 'Дата, площадь, вместимость, безопасность' },
  { I: 'code' as const, t: 'IT-партнёру', d: 'Разработка, инфраструктура, хранение и техническая поддержка.', a: 'Сроки, права, эксплуатационные расходы' },
  { I: 'expert' as const, t: 'Эксперту', d: 'Генеалогические консультации, оцифровка, фото- и видеозапись.', a: 'Состав услуги, оборудование, персонал' },
  { I: 'voice' as const, t: 'СМИ и сообществам', d: 'Информационная поддержка, аудитория, анонсы фестиваля.', a: 'Форматы и сроки публикаций' },
  { I: 'operator' as const, t: 'Будущему оператору', d: 'Приём и долгосрочное сопровождение платформы и социальной программы.', a: 'Ответственность, данные, расходы, график' },
];

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const [s, sp] = await Promise.all([getSettings(), searchParams]);
  const qr = fileUrl(s.donationQrId || null);
  return (
    <>
      <section className="relative overflow-hidden bg-ink-900 py-20 text-cream-50 sm:py-28">
        <div className="grain pointer-events-none absolute inset-0 opacity-[0.06]" />
        <div className="pointer-events-none absolute right-0 top-0 h-[30rem] w-[30rem] rounded-full bg-gold-500/15 blur-[120px]" />
        <div className="container-x relative">
          <Reveal><p className="eyebrow">Ваша помощь станет частью истории</p></Reveal>
          <h1 className="h-display mt-5 max-w-4xl text-[clamp(2.8rem,7vw,6rem)]">
            <TitleReveal delay={0.1}>Поддержать</TitleReveal>
            <TitleReveal delay={0.22} className="text-gold-400">«Голос рода»</TitleReveal>
          </h1>
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-2xl text-lg text-cream-100/70">
              Поддержка позволит запустить конкретные измеримые элементы: рабочее семейное дерево, фестивальные станции, оцифровку материалов и дальнейшую доступность проекта.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="py-24">
        <div className="container-x">
          <SectionHead eyebrow="Форматы участия" title="Партнёрство — не только деньги" />
          <Stagger className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {WAYS.map((w) => (
              <StaggerItem key={w.t} className="card spotlight group p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-cream-100 text-ink-900 transition-colors duration-500 group-hover:bg-ink-900 group-hover:text-cream-50">
                  <BrandIcon name={w.I} className="h-10 w-10" />
                </span>
                <h3 className="mt-6 font-serif text-2xl font-semibold">{w.t}</h3>
                <p className="mt-3 text-ink-600">{w.d}</p>
                <p className="mt-5 border-t border-ink-900/8 pt-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Согласуем: {w.a}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section id="form" className="scroll-mt-24 bg-cream-100 py-24">
        <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <SectionHead eyebrow="Прозрачность" title="Пожертвования" lead={s.donationText} />
            <Reveal delay={0.2} className="mt-8 space-y-6">
              {s.donationUrl && (
                <a href={s.donationUrl} target="_blank" rel="noreferrer" className="btn-gold px-8 py-4">Перейти к пожертвованию</a>
              )}
              {qr && (
                <div className="inline-block rounded-3xl bg-white p-4 shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr} alt="QR-код для пожертвования" className="h-48 w-48 object-contain" />
                </div>
              )}
              <div className="rounded-3xl bg-white/70 p-6 text-sm leading-relaxed text-ink-600">
                Мы публикуем цель сбора, категории расходования и отчёт об использовании средств. Безвозмездные услуги партнёров раскрываются отдельно, чтобы денежные потребности и реальная стоимость поддержки не смешивались.
                <p className="mt-3 font-semibold text-ink-800">{s.budgetText}</p>
              </div>
            </Reveal>
          </div>
          <Reveal className="card p-6 sm:p-10">
            <h2 className="font-serif text-3xl font-semibold">Оставить заявку</h2>
            <p className="mt-2 text-ink-500">Расскажите, чем готовы помочь — команда свяжется с вами и подготовит целевой запрос.</p>
            <div className="mt-8"><PartnerForm defaultKind={sp.kind} /></div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

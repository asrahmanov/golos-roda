import { Trash2 } from 'lucide-react';
import type { FaqItem, Partner, ProgramItem } from '@prisma/client';
import { db } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { fileUrl } from '@/lib/storage';
import { FESTIVAL_ZONE_NAMES } from '@/lib/constants';
import { deleteFaqAction, deletePartnerAction, deleteProgramAction, saveFaqAction, savePartnerAction, saveProgramAction, saveSettingsAction } from '@/actions/admin';
import { ConfirmButton, Field, SubmitButton } from '@/components/ui/Form';
import { ActionForm } from '@/components/admin/ActionForm';

function Section({ id, title, hint, children }: { id: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="card scroll-mt-6 p-6 sm:p-8">
      <h2 className="font-serif text-2xl font-semibold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-ink-500">{hint}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function DeleteBtn({ action, id }: { action: (fd: FormData) => Promise<void>; id: string }) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <ConfirmButton message="Удалить?" className="grid h-9 w-9 place-items-center rounded-xl text-ink-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 className="h-4 w-4" /></ConfirmButton>
    </form>
  );
}

function FaqFields({ f }: { f?: FaqItem }) {
  return (
    <>
      {f && <input type="hidden" name="id" value={f.id} />}
      <div className="grid gap-3 sm:grid-cols-[1fr_6rem]">
        <input name="question" defaultValue={f?.question} required placeholder="Вопрос" className="input" />
        <input name="order" type="number" defaultValue={f?.order ?? 0} className="input" title="Порядок" />
      </div>
      <textarea name="answer" defaultValue={f?.answer} required rows={3} placeholder="Ответ" className="input" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={f?.published ?? true} className="h-4 w-4 accent-gold-600" /> Показывать</label>
    </>
  );
}

function ProgramFields({ p }: { p?: ProgramItem }) {
  return (
    <>
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="grid gap-3 sm:grid-cols-[8rem_1fr_6rem]">
        <input name="time" defaultValue={p?.time} required placeholder="11:00" className="input" />
        <input name="title" defaultValue={p?.title} required placeholder="Название" className="input" />
        <input name="order" type="number" defaultValue={p?.order ?? 0} className="input" title="Порядок" />
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_16rem]">
        <input name="description" defaultValue={p?.description ?? ''} placeholder="Описание" className="input" />
        <input name="zone" defaultValue={p?.zone ?? ''} list="zones" placeholder="Зона / площадка" className="input" />
      </div>
    </>
  );
}

function PartnerFields({ p }: { p?: Partner }) {
  return (
    <>
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_10rem_6rem]">
        <input name="name" defaultValue={p?.name} required placeholder="Название" className="input" />
        <input name="url" defaultValue={p?.url ?? ''} placeholder="https://сайт" className="input" />
        <input name="kind" defaultValue={p?.kind ?? ''} placeholder="Тип (площадка, IT…)" className="input" />
        <input name="order" type="number" defaultValue={p?.order ?? 0} className="input" />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {p?.logoId && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileUrl(p.logoId)!} alt="" className="h-10 w-auto rounded bg-cream-100 object-contain p-1" />
        )}
        <label className="text-sm">Логотип: <input name="logo" type="file" accept="image/*" className="text-sm" /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={p?.published ?? true} className="h-4 w-4 accent-gold-600" /> Показывать</label>
      </div>
    </>
  );
}

export default async function ContentPage() {
  const [s, faq, program, partners] = await Promise.all([
    getSettings(),
    db.faqItem.findMany({ orderBy: { order: 'asc' } }),
    db.programItem.findMany({ orderBy: { order: 'asc' } }),
    db.partner.findMany({ orderBy: { order: 'asc' } }),
  ]);
  const qr = fileUrl(s.donationQrId || null);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Управление сайтом</p>
        <h1 className="h-display mt-2 text-4xl">Контент сайта</h1>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {[['settings', 'Основное'], ['faq', 'Вопросы'], ['program', 'Программа'], ['partners', 'Партнёры']].map(([id, l]) => (
            <a key={id} href={`#${id}`} className="chip bg-white px-3 py-1.5 text-ink-600 ring-1 ring-ink-900/8 hover:bg-cream-50">{l}</a>
          ))}
        </div>
      </div>

      <Section id="settings" title="Основные настройки">
        <ActionForm action={saveSettingsAction} className="grid gap-5">
          <input type="hidden" name="_bool" value="1" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Надзаголовок первого экрана"><input name="heroEyebrow" defaultValue={s.heroEyebrow} className="input" /></Field>
            <Field label="Заголовок"><input name="heroTitle" defaultValue={s.heroTitle} className="input" /></Field>
          </div>
          <Field label="Подзаголовок"><textarea name="heroSubtitle" defaultValue={s.heroSubtitle} rows={2} className="input" /></Field>
          <Field label="Объявление в верхней полосе" hint="Пусто — полоса скрыта"><input name="announcement" defaultValue={s.announcement} className="input" /></Field>

          <h3 className="mt-2 font-semibold">Фестиваль</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Дата и время (для отсчёта)" hint="Формат: 2026-11-22T11:00:00+03:00"><input name="festivalDate" defaultValue={s.festivalDate} className="input" /></Field>
            <Field label="Дата текстом"><input name="festivalDateText" defaultValue={s.festivalDateText} className="input" /></Field>
            <Field label="Полный запуск"><input name="launchDateText" defaultValue={s.launchDateText} className="input" /></Field>
            <Field label="Площадка"><input name="festivalVenue" defaultValue={s.festivalVenue} className="input" /></Field>
            <Field label="Адрес" className="sm:col-span-2"><input name="festivalAddress" defaultValue={s.festivalAddress} className="input" /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="registrationOpen" defaultChecked={s.registrationOpen === 'true'} className="h-4 w-4 accent-gold-600" /> Регистрация на фестиваль открыта</label>

          <h3 className="mt-2 font-semibold">Показатели</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Цель: семей"><input name="kpiFamiliesTarget" defaultValue={s.kpiFamiliesTarget} className="input" /></Field>
            <Field label="Цель: деревьев"><input name="kpiTreesTarget" defaultValue={s.kpiTreesTarget} className="input" /></Field>
            <Field label="Строка о бюджете"><input name="budgetText" defaultValue={s.budgetText} className="input" /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="showLiveStats" defaultChecked={s.showLiveStats === 'true'} className="h-4 w-4 accent-gold-600" /> Показывать живую статистику на главной</label>

          <h3 className="mt-2 font-semibold">Контакты</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Почта"><input name="contactEmail" defaultValue={s.contactEmail} className="input" /></Field>
            <Field label="Телефон"><input name="contactPhone" defaultValue={s.contactPhone} className="input" /></Field>
            <Field label="Telegram (ссылка)"><input name="telegram" defaultValue={s.telegram} className="input" placeholder="https://t.me/…" /></Field>
            <Field label="ВКонтакте (ссылка)"><input name="vk" defaultValue={s.vk} className="input" placeholder="https://vk.com/…" /></Field>
          </div>

          <h3 className="mt-2 font-semibold">Пожертвования</h3>
          <Field label="Ссылка на страницу сбора" hint="Добавьте после утверждения законной схемы приёма средств"><input name="donationUrl" defaultValue={s.donationUrl} className="input" /></Field>
          <Field label="Текст о пожертвованиях"><textarea name="donationText" defaultValue={s.donationText} rows={3} className="input" /></Field>
          <div className="flex flex-wrap items-center gap-4">
            {qr && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="QR" className="h-24 w-24 rounded-xl bg-white object-contain p-1 ring-1 ring-ink-900/8" />
            )}
            <label className="text-sm">QR-код: <input name="donationQr" type="file" accept="image/*" className="text-sm" /></label>
            {qr && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="removeQr" className="h-4 w-4" /> удалить QR</label>}
          </div>
          <SubmitButton className="btn-gold w-fit">Сохранить настройки</SubmitButton>
        </ActionForm>
      </Section>

      <Section id="faq" title="Вопросы и ответы">
        <div className="grid gap-4">
          {faq.map((f) => (
            <div key={f.id} className="flex items-start gap-3 rounded-2xl bg-cream-100 p-4">
              <ActionForm action={saveFaqAction} className="grid flex-1 gap-3"><FaqFields f={f} /><SubmitButton className="btn-dark btn-sm w-fit">Сохранить</SubmitButton></ActionForm>
              <DeleteBtn action={deleteFaqAction} id={f.id} />
            </div>
          ))}
          <ActionForm action={saveFaqAction} className="grid gap-3 rounded-2xl border-2 border-dashed border-ink-900/12 p-4" resetOnSuccess>
            <p className="text-sm font-semibold">Новый вопрос</p>
            <FaqFields />
            <SubmitButton className="btn-gold btn-sm w-fit">Добавить</SubmitButton>
          </ActionForm>
        </div>
      </Section>

      <Section id="program" title="Программа фестиваля">
        <datalist id="zones">{['Центральная площадка', 'Уличная зона', ...FESTIVAL_ZONE_NAMES].map((z) => <option key={z} value={z} />)}</datalist>
        <div className="grid gap-4">
          {program.map((p) => (
            <div key={p.id} className="flex items-start gap-3 rounded-2xl bg-cream-100 p-4">
              <ActionForm action={saveProgramAction} className="grid flex-1 gap-3"><ProgramFields p={p} /><SubmitButton className="btn-dark btn-sm w-fit">Сохранить</SubmitButton></ActionForm>
              <DeleteBtn action={deleteProgramAction} id={p.id} />
            </div>
          ))}
          <ActionForm action={saveProgramAction} className="grid gap-3 rounded-2xl border-2 border-dashed border-ink-900/12 p-4" resetOnSuccess>
            <p className="text-sm font-semibold">Новый пункт программы</p>
            <ProgramFields />
            <SubmitButton className="btn-gold btn-sm w-fit">Добавить</SubmitButton>
          </ActionForm>
        </div>
      </Section>

      <Section id="partners" title="Партнёры" hint="Логотипы показываются на главной странице. Формат признания поддержки согласуйте с партнёром заранее.">
        <div className="grid gap-4">
          {partners.map((p) => (
            <div key={p.id} className="flex items-start gap-3 rounded-2xl bg-cream-100 p-4">
              <ActionForm action={savePartnerAction} className="grid flex-1 gap-3"><PartnerFields p={p} /><SubmitButton className="btn-dark btn-sm w-fit">Сохранить</SubmitButton></ActionForm>
              <DeleteBtn action={deletePartnerAction} id={p.id} />
            </div>
          ))}
          <ActionForm action={savePartnerAction} className="grid gap-3 rounded-2xl border-2 border-dashed border-ink-900/12 p-4" resetOnSuccess>
            <p className="text-sm font-semibold">Новый партнёр</p>
            <PartnerFields />
            <SubmitButton className="btn-gold btn-sm w-fit">Добавить</SubmitButton>
          </ActionForm>
        </div>
      </Section>
    </div>
  );
}

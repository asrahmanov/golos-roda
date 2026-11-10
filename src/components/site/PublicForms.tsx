'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { BrandIcon } from '@/components/ui/BrandIcon';
import { festivalRegisterAction, partnerRequestAction } from '@/actions/public';
import { FormMessage, SubmitButton } from '@/components/ui/Form';
import { REQUEST_KIND_LABEL } from '@/lib/constants';
import { cn } from '@/lib/utils';

function Stepper({ name, label, def = 0 }: { name: string; label: string; def?: number }) {
  const [v, setV] = useState(def);
  return (
    <div className="rounded-2xl border border-white/12 bg-white/5 p-3">
      <span className="block text-xs text-cream-100/60">{label}</span>
      <div className="mt-2 flex items-center justify-between">
        <button type="button" className="grid h-8 w-8 place-items-center rounded-full bg-white/10 hover:bg-white/20" onClick={() => setV(Math.max(0, v - 1))} aria-label={`Меньше: ${label}`}>
          <Minus className="h-4 w-4" />
        </button>
        <span className="font-serif text-2xl tabular-nums">{v}</span>
        <button type="button" className="grid h-8 w-8 place-items-center rounded-full bg-white/10 hover:bg-white/20" onClick={() => setV(Math.min(20, v + 1))} aria-label={`Больше: ${label}`}>
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <input type="hidden" name={name} value={v} />
    </div>
  );
}

function Success({ text, dark = true }: { text: string; dark?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-10 text-center">
      <motion.div initial={{ rotate: -20, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}>
        <BrandIcon name="celebrate" accent={dark ? '#e3b77e' : '#c58d4f'} className={cn('mx-auto h-20 w-20', dark ? 'text-cream-50' : 'text-ink-900')} />
      </motion.div>
      <h3 className={cn('mt-6 font-serif text-3xl font-semibold', dark ? 'text-cream-50' : 'text-ink-900')}>Спасибо!</h3>
      <p className={cn('mx-auto mt-3 max-w-md', dark ? 'text-cream-100/70' : 'text-ink-600')}>{text}</p>
    </motion.div>
  );
}

export function FestivalForm({ zones }: { zones: string[] }) {
  const [state, action] = useActionState(festivalRegisterAction, undefined);
  if (state?.ok) return <Success text={state.message ?? ''} />;
  return (
    <form action={action} className="grid gap-4">
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="name" required placeholder="Ваше имя *" className="input-dark" autoComplete="name" />
        <input name="familyName" placeholder="Фамилия семьи" className="input-dark" />
        <input name="phone" required type="tel" placeholder="Телефон *" className="input-dark" autoComplete="tel" />
        <input name="email" type="email" placeholder="Почта" className="input-dark" autoComplete="email" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Stepper name="adults" label="Взрослые" def={1} />
        <Stepper name="children" label="Дети" />
        <Stepper name="seniors" label="Старшее поколение" />
      </div>
      <fieldset>
        <legend className="mb-2 text-sm text-cream-100/70">Какие зоны интересны?</legend>
        <div className="flex flex-wrap gap-2">
          {zones.map((z) => (
            <label key={z} className="cursor-pointer">
              <input type="checkbox" name="zones" value={z} className="peer sr-only" />
              <span className="chip border border-white/15 px-4 py-2 text-cream-100/80 transition peer-checked:border-gold-400 peer-checked:bg-gold-500 peer-checked:text-ink-950 peer-focus-visible:ring-2 peer-focus-visible:ring-gold-400">
                {z}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <textarea name="comment" rows={3} placeholder="Комментарий: что хотите принести, нужна ли помощь с доступностью" className="input-dark resize-none" />
      <label className="flex items-start gap-3 text-sm text-cream-100/70">
        <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 accent-gold-500" />
        <span>
          Согласен(на) на обработку персональных данных в соответствии с{' '}
          <Link href="/privacy" className="text-gold-300 underline" target="_blank">политикой конфиденциальности</Link>
        </span>
      </label>
      <FormMessage state={state} />
      <SubmitButton className="btn-gold w-full py-4 text-[15px]" pendingText="Отправляем…">Зарегистрировать семью</SubmitButton>
    </form>
  );
}

export function PartnerForm({ defaultKind = 'CONTACT' }: { defaultKind?: string }) {
  const [state, action] = useActionState(partnerRequestAction, undefined);
  if (state?.ok) return <Success text={state.message ?? ''} dark={false} />;
  return (
    <form action={action} className="grid gap-4">
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />
      <label className="block">
        <span className="label">Как хотите помочь?</span>
        <select name="kind" defaultValue={defaultKind} className="input">
          {Object.entries(REQUEST_KIND_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="name" required placeholder="Имя *" className="input" autoComplete="name" />
        <input name="organization" placeholder="Организация" className="input" autoComplete="organization" />
        <input name="email" type="email" placeholder="Почта" className="input" autoComplete="email" />
        <input name="phone" type="tel" placeholder="Телефон" className="input" autoComplete="tel" />
      </div>
      <textarea name="message" required rows={4} placeholder="Расскажите о вашем предложении *" className="input resize-none" />
      <label className="flex items-start gap-3 text-sm text-ink-600">
        <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 accent-gold-600" />
        <span>
          Согласен(на) на обработку персональных данных в соответствии с{' '}
          <Link href="/privacy" className="text-gold-700 underline" target="_blank">политикой конфиденциальности</Link>
        </span>
      </label>
      <FormMessage state={state} />
      <SubmitButton className="btn-dark w-full py-4" pendingText="Отправляем…">Отправить заявку</SubmitButton>
    </form>
  );
}

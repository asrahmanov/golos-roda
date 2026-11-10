'use client';

import { useActionState, useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';
import { changeMemberRoleAction, createInviteAction } from '@/actions/family';
import { FormMessage, SubmitButton } from '@/components/ui/Form';

export function InviteLink({ token, familyName }: { token: string; familyName: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? `${window.location.origin}/invite/${token}` : `/invite/${token}`;
  const copy = async () => {
    await navigator.clipboard.writeText(url).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Голос рода', text: `Приглашаю в наше семейное пространство «${familyName}»`, url }).catch(() => null);
    } else copy();
  };
  return (
    <div className="flex items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-xl bg-cream-100 px-3 py-2 text-xs text-ink-600" suppressHydrationWarning>{url}</code>
      <button type="button" onClick={copy} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink-900 text-gold-300 hover:bg-ink-700" aria-label="Скопировать ссылку">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
      <button type="button" onClick={share} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold-500 text-ink-950 hover:bg-gold-400" aria-label="Поделиться">
        <Share2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export function RoleSelect({ id, role }: { id: string; role: string }) {
  return (
    <form action={changeMemberRoleAction}>
      <input type="hidden" name="id" value={id} />
      <select name="role" defaultValue={role} onChange={(e) => e.currentTarget.form?.requestSubmit()} className="rounded-xl border border-ink-900/12 bg-white px-3 py-2 text-sm">
        <option value="OWNER">Хранитель</option>
        <option value="EDITOR">Соавтор</option>
        <option value="VIEWER">Читатель</option>
      </select>
    </form>
  );
}

export function CreateInviteForm({ familyId }: { familyId: string }) {
  const [state, action] = useActionState(createInviteAction, undefined);
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="familyId" value={familyId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label">Права</span>
          <select name="role" className="input" defaultValue="EDITOR">
            <option value="EDITOR">Соавтор — может дополнять</option>
            <option value="VIEWER">Читатель — только просмотр</option>
          </select>
        </label>
        <label className="block">
          <span className="label">Для кого (заметка)</span>
          <input name="note" className="input" placeholder="Например: тётя Оля" />
        </label>
        <label className="block">
          <span className="label">Действует, дней</span>
          <input name="days" type="number" min={1} max={60} defaultValue={14} className="input" />
        </label>
        <label className="block">
          <span className="label">Сколько человек может войти</span>
          <input name="maxUses" type="number" min={1} max={50} defaultValue={5} className="input" />
        </label>
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-gold w-fit">Создать ссылку-приглашение</SubmitButton>
    </form>
  );
}

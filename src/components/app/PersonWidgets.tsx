'use client';

import { useActionState, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2 } from 'lucide-react';
import { addRelationAction } from '@/actions/family';
import { FormMessage, SubmitButton } from '@/components/ui/Form';
import { initials } from '@/lib/utils';

export function AvatarUpload({ familyId, personId, src, name, canEdit }: { familyId: string; personId: string; src: string | null; name: string; canEdit: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    setErr(null);
    const fd = new FormData();
    fd.set('file', f);
    fd.set('mode', 'avatar');
    fd.set('personId', personId);
    const res = await fetch(`/api/families/${familyId}/upload`, { method: 'POST', body: fd }).then((r) => r.json()).catch(() => ({ error: 'Ошибка сети' }));
    setBusy(false);
    if (res.error) setErr(res.error);
    else router.refresh();
  };
  return (
    <div className="relative">
      <div className="grid h-32 w-32 place-items-center overflow-hidden rounded-[2rem] bg-cream-200 font-serif text-4xl font-semibold text-ink-500 shadow-xl ring-4 ring-white sm:h-40 sm:w-40">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name} className="h-full w-full object-cover" />
        ) : (
          initials(name)
        )}
      </div>
      {canEdit && (
        <>
          <input ref={ref} type="file" accept="image/*" className="sr-only" onChange={onChange} />
          <button onClick={() => ref.current?.click()} disabled={busy} className="absolute -bottom-2 -right-2 grid h-11 w-11 place-items-center rounded-full bg-gold-500 text-ink-950 shadow-lg transition hover:scale-110" aria-label="Загрузить фото">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </button>
        </>
      )}
      {err && <p className="absolute top-full mt-3 w-48 text-xs text-rose-500">{err}</p>}
    </div>
  );
}

export function AddRelationForm({ personId, options }: { personId: string; options: { id: string; name: string }[] }) {
  const [state, action] = useActionState(addRelationAction, undefined);
  if (!options.length) return null;
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="personId" value={personId} />
      <div className="grid gap-2 sm:grid-cols-[auto_1fr]">
        <select name="kind" className="input py-2.5 text-sm">
          <option value="parent">Родитель —</option>
          <option value="child">Ребёнок —</option>
          <option value="spouse">Супруг(а) —</option>
        </select>
        <select name="otherId" className="input py-2.5 text-sm" required>
          <option value="">выберите из дерева</option>
          {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-dark btn-sm w-fit">Связать</SubmitButton>
    </form>
  );
}

'use client';

export function AutoSubmitSelect({
  action,
  id,
  name,
  value,
  options,
}: {
  action: (fd: FormData) => Promise<void>;
  id: string;
  name: string;
  value: string;
  options: { v: string; l: string }[];
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <select name={name} defaultValue={value} onChange={(e) => e.currentTarget.form?.requestSubmit()} className="rounded-xl border border-ink-900/12 bg-white px-3 py-2 text-sm font-medium">
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </form>
  );
}

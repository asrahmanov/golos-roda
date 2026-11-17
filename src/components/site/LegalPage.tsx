import { Paragraphs } from '@/components/ui/Paragraphs';
import { EMAIL_TOKEN } from '@/lib/legal';
import { typo } from '@/lib/typo';

export function LegalPage({ title, text, updated, email }: { title: string; text: string; updated: string; email: string }) {
  return (
    <section className="py-16 sm:py-24">
      <div className="container-x max-w-3xl">
        <h1 className="h-display text-[clamp(2.2rem,5vw,3.5rem)]">{title}</h1>
        {updated && <p className="mt-4 text-sm text-ink-500">Редакция от {updated}</p>}
        <Paragraphs text={typo(text.replaceAll(EMAIL_TOKEN, email))} className="mt-10 text-ink-700" />
      </div>
    </section>
  );
}

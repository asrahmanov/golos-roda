import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { fileUrl } from '@/lib/storage';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Motion';

export const metadata: Metadata = {
  title: 'Истории, которые нас объединяют',
  description: 'Семейные истории участников проекта «Голос рода», опубликованные с согласия авторов.',
};

export default async function StoriesPage() {
  const stories = await db.publicStory.findMany({ where: { status: 'APPROVED' }, orderBy: { publishedAt: 'desc' } });
  return (
    <section className="py-20 sm:py-28">
      <div className="container-x">
        <Reveal><p className="eyebrow">Экспозиция</p></Reveal>
        <Reveal delay={0.1}>
          <h1 className="h-display mt-4 max-w-3xl text-[clamp(2.6rem,6vw,5rem)]">Истории, которые нас объединяют</h1>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mt-5 max-w-2xl text-lg text-ink-600">
            Семьи-участники делятся воспоминаниями, чтобы вдохновить других на собственный поиск. Каждая история опубликована только с согласия автора.
          </p>
        </Reveal>
        {stories.length === 0 ? (
          <Reveal className="mt-16 rounded-3xl border border-dashed border-ink-900/15 p-12 text-center">
            <p className="font-serif text-2xl">Первые истории появятся совсем скоро</p>
            <p className="mt-3 text-ink-500">Создайте семейное пространство и предложите свою историю для экспозиции.</p>
            <Link href="/register" className="btn-gold mt-8">Создать летопись</Link>
          </Reveal>
        ) : (
          <Stagger className="mt-16 columns-1 gap-6 sm:columns-2 lg:columns-3 [&>*]:mb-6">
            {stories.map((st) => (
              <StaggerItem key={st.id} className="break-inside-avoid">
                <Link href={`/stories/${st.id}`} className="group block overflow-hidden rounded-3xl bg-white ring-1 ring-ink-900/8 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
                  {st.imageId && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fileUrl(st.imageId, true)!} alt="" className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                  )}
                  <div className="p-7">
                    <h2 className="font-serif text-2xl font-semibold leading-snug">{st.title}</h2>
                    <p className="mt-3 line-clamp-5 leading-relaxed text-ink-600">{st.text}</p>
                    <p className="mt-5 text-sm font-semibold text-gold-700">— {st.authorName}</p>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </section>
  );
}

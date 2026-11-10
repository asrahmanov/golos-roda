import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandIcon } from '@/components/ui/BrandIcon';
import { db } from '@/lib/db';
import { fileUrl } from '@/lib/storage';
import { formatDate } from '@/lib/utils';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Motion';

export const metadata: Metadata = { title: 'Новости проекта' };

export default async function NewsPage() {
  const news = await db.news.findMany({ where: { published: true }, orderBy: { publishedAt: 'desc' } });
  return (
    <section className="py-20 sm:py-28">
      <div className="container-x">
        <Reveal><p className="eyebrow">Новости</p></Reveal>
        <Reveal delay={0.1}><h1 className="h-display mt-4 text-[clamp(2.6rem,6vw,5rem)]">Хроника проекта</h1></Reveal>
        {news.length === 0 ? (
          <p className="mt-12 text-ink-500">Новостей пока нет.</p>
        ) : (
          <Stagger className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {news.map((n) => (
              <StaggerItem key={n.id}>
                <Link href={`/news/${n.slug}`} className="group block">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-ink-900">
                    {n.coverId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={fileUrl(n.coverId, true)!} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="grid h-full place-items-center"><BrandIcon name="news" draw={false} className="h-16 w-16 text-cream-50/40" /></div>
                    )}
                  </div>
                  <p className="mt-4 text-xs font-semibold text-gold-700">{formatDate(n.publishedAt)}</p>
                  <h2 className="mt-2 font-serif text-2xl font-semibold leading-snug transition-colors group-hover:text-gold-700">{n.title}</h2>
                  {n.excerpt && <p className="mt-2 line-clamp-3 text-ink-600">{n.excerpt}</p>}
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </section>
  );
}

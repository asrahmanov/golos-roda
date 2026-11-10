import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/db';
import { fileUrl } from '@/lib/storage';
import { formatDate } from '@/lib/utils';
import { Paragraphs } from '@/components/ui/Paragraphs';
import { Reveal } from '@/components/ui/Motion';

async function load(slug: string) {
  return db.news.findFirst({ where: { slug, published: true } });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const n = await load((await params).slug);
  return n ? { title: n.title, description: n.excerpt ?? undefined } : {};
}

export default async function NewsItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const n = await load((await params).slug);
  if (!n) notFound();
  return (
    <article className="py-16 sm:py-24">
      <div className="container-x max-w-3xl">
        <Link href="/news" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-500 hover:text-gold-700">
          <ArrowLeft className="h-4 w-4" /> Все новости
        </Link>
        <Reveal>
          <p className="mt-8 text-sm font-semibold text-gold-700">{formatDate(n.publishedAt)}</p>
          <h1 className="h-display mt-3 text-[clamp(2.2rem,5vw,3.8rem)]">{n.title}</h1>
          {n.excerpt && <p className="mt-5 text-xl text-ink-600">{n.excerpt}</p>}
        </Reveal>
        {n.coverId && (
          <Reveal className="mt-10 overflow-hidden rounded-[2rem]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fileUrl(n.coverId)!} alt="" className="w-full" />
          </Reveal>
        )}
        <Reveal className="mt-10 text-lg text-ink-800"><Paragraphs text={n.body} /></Reveal>
      </div>
    </article>
  );
}

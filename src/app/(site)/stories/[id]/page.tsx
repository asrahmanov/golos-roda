import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/db';
import { fileUrl } from '@/lib/storage';
import { formatDate } from '@/lib/utils';
import { Paragraphs } from '@/components/ui/Paragraphs';
import { Reveal } from '@/components/ui/Motion';

async function load(id: string) {
  return db.publicStory.findFirst({ where: { id, status: 'APPROVED' } });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const st = await load((await params).id);
  return st ? { title: st.title, description: st.text.slice(0, 160) } : {};
}

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const st = await load((await params).id);
  if (!st) notFound();
  return (
    <article className="py-16 sm:py-24">
      <div className="container-x max-w-3xl">
        <Link href="/stories" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-500 hover:text-gold-700">
          <ArrowLeft className="h-4 w-4" /> Все истории
        </Link>
        <Reveal>
          <h1 className="h-display mt-8 text-[clamp(2.4rem,5vw,4rem)]">{st.title}</h1>
          <p className="mt-4 text-sm text-ink-500">
            {st.authorName}
            {st.publishedAt && ` · ${formatDate(st.publishedAt)}`}
          </p>
        </Reveal>
        {st.imageId && (
          <Reveal className="mt-10 overflow-hidden rounded-[2rem]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fileUrl(st.imageId)!} alt={st.title} className="w-full" />
          </Reveal>
        )}
        <Reveal className="mt-10 font-serif text-xl text-ink-800">
          <Paragraphs text={st.text} />
        </Reveal>
      </div>
    </article>
  );
}

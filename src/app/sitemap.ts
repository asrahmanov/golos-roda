import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://svyaz-pokoleny.ru';
  const [news, stories] = await Promise.all([
    db.news.findMany({ where: { published: true }, select: { slug: true, publishedAt: true } }),
    db.publicStory.findMany({ where: { status: 'APPROVED' }, select: { id: true, publishedAt: true } }),
  ]);
  const pages = ['', '/festival', '/support', '/stories', '/news', '/register', '/privacy', '/terms'];
  return [
    ...pages.map((p) => ({ url: `${site}${p}`, changeFrequency: 'weekly' as const, priority: p === '' ? 1 : 0.7 })),
    ...news.map((n) => ({ url: `${site}/news/${n.slug}`, lastModified: n.publishedAt })),
    ...stories.map((s) => ({ url: `${site}/stories/${s.id}`, lastModified: s.publishedAt ?? undefined })),
  ];
}

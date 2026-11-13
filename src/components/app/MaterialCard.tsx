import Link from 'next/link';
import { FileText, Link2, Lock, Mic, PenLine, Users2, Video } from 'lucide-react';
import type { MaterialType, Visibility } from '@prisma/client';
import { MATERIAL_LABEL } from '@/lib/constants';
import { fileUrl } from '@/lib/storage';

const ICON: Record<MaterialType, typeof FileText> = { PHOTO: FileText, DOCUMENT: FileText, MEMORY: PenLine, AUDIO: Mic, VIDEO: Video, LINK: Link2 };

export type MaterialCardData = {
  id: string;
  type: MaterialType;
  title: string;
  body: string | null;
  dateText: string | null;
  visibility: Visibility;
  fileId: string | null;
  file?: { mime: string; thumbPath: string | null } | null;
  persons?: { person: { firstName: string; lastName: string | null } }[];
  _count?: { comments: number };
};

export function MaterialCard({ m, familyId }: { m: MaterialCardData; familyId: string }) {
  const I = ICON[m.type];
  const hasThumb = m.fileId && m.file?.thumbPath;
  return (
    <Link href={`/app/family/${familyId}/archive/${m.id}`} className="group block overflow-hidden rounded-3xl bg-white ring-1 ring-ink-900/8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[4/3] overflow-hidden bg-cream-100">
        {hasThumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileUrl(m.fileId, true)!} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : m.type === 'MEMORY' ? (
          <div className="h-full bg-gradient-to-br from-cream-100 to-cream-200 p-5">
            <span className="font-serif text-5xl leading-none text-gold-400">“</span>
            <p className="line-clamp-4 text-[15px] leading-relaxed text-ink-700">{m.body}</p>
          </div>
        ) : (
          <div className={`grid h-full place-items-center ${m.type === 'AUDIO' ? 'bg-ink-900' : ''}`}>
            {m.type === 'AUDIO' ? (
              <div className="flex items-end gap-1">
                {[14, 28, 18, 36, 22, 40, 16, 30, 20, 34, 12].map((h, i) => (
                  <span key={i} className="w-1.5 rounded-full bg-gold-400/80 transition-all duration-500 group-hover:bg-gold-300" style={{ height: h }} />
                ))}
              </div>
            ) : (
              <I className="h-10 w-10 text-ink-300" strokeWidth={1.4} />
            )}
          </div>
        )}
        <span className="absolute left-3 top-3 chip bg-white/90 text-ink-700 backdrop-blur">
          <I className="h-3 w-3" /> {MATERIAL_LABEL[m.type]}
        </span>
        {m.visibility !== 'FAMILY' && (
          <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-ink-900/80 text-gold-300" title={m.visibility === 'PRIVATE' ? 'Только автор' : 'Хранители и соавторы'}>
            <Lock className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="line-clamp-2 font-semibold leading-snug">{m.title}</p>
        <div className="mt-2 flex items-center gap-2 text-xs text-ink-400">
          {m.dateText && <span>{m.dateText}</span>}
          {m.persons && m.persons.length > 0 && (
            <span className="flex min-w-0 items-center gap-1 truncate">
              <Users2 className="h-3 w-3 shrink-0" />
              {m.persons.map((p) => p.person.firstName).join(', ')}
            </span>
          )}
          {m._count && m._count.comments > 0 && <span className="ml-auto shrink-0">💬 {m._count.comments}</span>}
        </div>
      </div>
    </Link>
  );
}

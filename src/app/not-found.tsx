import Link from 'next/link';
import { InfinityMark } from '@/components/ui/Logo';

export default function NotFound() {
  return (
    <div className="grid min-h-svh place-items-center bg-ink-900 px-6 text-center text-cream-50">
      <div>
        <InfinityMark className="mx-auto h-16 w-32 text-gold-400" />
        <h1 className="h-display mt-8 text-5xl sm:text-6xl">Страница потерялась</h1>
        <p className="mt-4 text-cream-100/60">Но связь не прервалась — вернитесь на главную.</p>
        <Link href="/" className="btn-gold mt-10">На главную</Link>
      </div>
    </div>
  );
}

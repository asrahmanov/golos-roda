import Image from 'next/image';
import { Logo } from '@/components/ui/Logo';

export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink-900 lg:block">
        <Image src="/img/hands.jpg" alt="" fill priority className="object-cover opacity-70" sizes="50vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />
        <div className="absolute inset-x-12 bottom-12 text-cream-50">
          <p className="font-serif text-4xl font-semibold leading-tight">«Пока близкие рядом — у истории есть голос».</p>
          <p className="mt-4 text-cream-100/60">Сохраняя прошлое, мы объединяем людей в настоящем и оставляем наследие будущему.</p>
        </div>
      </div>
      <div className="flex flex-col px-5 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>
      </div>
    </div>
  );
}

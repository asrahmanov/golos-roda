import type { Metadata } from 'next';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { logoutAction } from '@/actions/auth';
import { InfinityMark } from '@/components/ui/Logo';
import { AdminNav } from '@/components/admin/AdminNav';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Админ-панель', robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [registrations, requests, stories, tickets] = await Promise.all([
    db.festivalRegistration.count({ where: { status: 'NEW' } }),
    db.partnerRequest.count({ where: { status: 'NEW' } }),
    db.publicStory.count({ where: { status: 'PENDING' } }),
    db.supportTicket.count({ where: { status: 'NEW' } }),
  ]);
  return (
    <div className="min-h-svh bg-cream-100 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 z-30 bg-ink-900 px-3 py-3 text-cream-50 lg:h-svh lg:px-4 lg:py-6">
        <div className="flex items-center justify-between gap-3 px-2 lg:mb-8 lg:block">
          <Link href="/admin" className="flex items-center gap-2.5">
            <InfinityMark className="h-5 w-10 text-gold-400" />
            <span className="font-serif text-lg font-semibold">Админ-панель</span>
          </Link>
          <form action={logoutAction} className="lg:hidden">
            <button className="rounded-full p-2 text-cream-100/60" aria-label="Выйти"><LogOut className="h-4 w-4" /></button>
          </form>
        </div>
        <div className="mt-3 lg:mt-0">
          <AdminNav badges={{ registrations, requests, stories, tickets }} />
        </div>
        <div className="absolute inset-x-4 bottom-6 hidden lg:block">
          <p className="truncate px-2 text-xs text-cream-100/40">{admin.email}</p>
          <form action={logoutAction}>
            <button className="mt-2 flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-cream-100/60 hover:text-cream-50"><LogOut className="h-4 w-4" /> Выйти</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}

import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth';
import { AppHeader } from '@/components/app/AppHeader';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Семейное пространство', robots: { index: false } };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-svh bg-cream-50">
      <AppHeader name={user.name} isAdmin={user.role === 'ADMIN'} />
      {children}
    </div>
  );
}

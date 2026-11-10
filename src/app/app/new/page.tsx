import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { CreateFamilyForm } from '@/components/app/CreateFamilyForm';

export default async function NewFamilyPage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <Link href="/app" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" /> Мои семьи
      </Link>
      <h1 className="h-display mt-6 text-4xl">Новое семейное пространство</h1>
      <div className="card mt-8 p-6 sm:p-10">
        <CreateFamilyForm defaultLastName={user.name.split(' ')[1]} />
      </div>
    </div>
  );
}

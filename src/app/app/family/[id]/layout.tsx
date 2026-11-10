import { requireFamily, ROLE_LABEL } from '@/lib/family';
import { FamilyTabs } from '@/components/app/FamilyTabs';

export default async function FamilyLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { family, role } = await requireFamily(id);
  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-16 pt-6 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">{ROLE_LABEL[role]}</p>
          <h1 className="mt-1 truncate font-serif text-3xl font-semibold sm:text-4xl">{family.name}</h1>
        </div>
        <FamilyTabs familyId={id} />
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

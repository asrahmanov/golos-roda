import Link from 'next/link';
import { Download, LogOut, Trash2, UploadCloud } from 'lucide-react';
import { db } from '@/lib/db';
import { requireFamily } from '@/lib/family';
import { formatSize } from '@/lib/utils';
import { deleteFamilyAction, leaveFamilyAction } from '@/actions/family';
import { ConfirmButton } from '@/components/ui/Form';
import { DeleteConfirmInput, FamilyEditForm } from '@/components/app/FamilySettingsForms';

export default async function FamilySettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { family, role } = await requireFamily(id);
  const isOwner = role === 'OWNER';
  const usage = isOwner ? await db.storedFile.aggregate({ where: { familyId: id }, _sum: { size: true }, _count: true }) : null;

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      {isOwner && (
        <section className="card p-6 sm:p-8">
          <h2 className="font-serif text-2xl font-semibold">Семейное пространство</h2>
          <div className="mt-5"><FamilyEditForm id={id} name={family.name} description={family.description} /></div>
        </section>
      )}

      {isOwner && usage && (
        <section className="card p-6 sm:p-8">
          <h2 className="font-serif text-2xl font-semibold">Выгрузка архива</h2>
          <p className="mt-2 text-ink-600">
            Скачайте всё: дерево, карточки, воспоминания и оригиналы файлов в одном ZIP-архиве. Рекомендуем делать это время от времени.
          </p>
          <p className="mt-2 text-sm text-ink-400">Файлов: {usage._count} · объём: {formatSize(usage._sum.size ?? 0)} из 5 ГБ</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={`/api/families/${id}/export`} className="btn-gold">
              <Download className="h-4 w-4" /> Скачать архив семьи
            </a>
            <Link href={`/app/import?target=${id}`} className="btn-ghost">
              <UploadCloud className="h-4 w-4" /> Загрузить архив или дерево
            </Link>
          </div>
        </section>
      )}

      <section className="card p-6 sm:p-8">
        <h2 className="font-serif text-2xl font-semibold">Покинуть пространство</h2>
        <p className="mt-2 text-ink-600">Вы потеряете доступ к дереву и архиву. Добавленные вами материалы останутся у семьи.</p>
        <form action={leaveFamilyAction} className="mt-5">
          <input type="hidden" name="familyId" value={id} />
          <ConfirmButton message="Покинуть семейное пространство?" className="btn-ghost">
            <LogOut className="h-4 w-4" /> Покинуть
          </ConfirmButton>
        </form>
      </section>

      {isOwner && (
        <section className="rounded-3xl border-2 border-rose-500/30 p-6 sm:p-8">
          <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-rose-500"><Trash2 className="h-5 w-5" /> Удалить пространство</h2>
          <p className="mt-2 text-ink-600">Дерево, карточки, все материалы и файлы будут удалены безвозвратно для всех участников. Сначала скачайте архив.</p>
          <form action={deleteFamilyAction} className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input type="hidden" name="familyId" value={id} />
            <DeleteConfirmInput name={family.name} />
          </form>
          <p className="mt-2 text-xs text-ink-400">Для подтверждения введите название: «{family.name}»</p>
        </section>
      )}
    </div>
  );
}

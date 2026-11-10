import { requireUser } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import { DeleteAccountForm, PasswordForm, ProfileForm } from '@/components/app/ProfileForms';

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:py-12">
      <div>
        <p className="eyebrow">Аккаунт</p>
        <h1 className="h-display mt-3 text-4xl">Профиль и безопасность</h1>
        <p className="mt-2 text-sm text-ink-400">С нами с {formatDate(user.createdAt)}</p>
      </div>
      <section className="card p-6 sm:p-8">
        <h2 className="font-serif text-2xl font-semibold">Личные данные</h2>
        <div className="mt-5"><ProfileForm name={user.name} phone={user.phone} email={user.email} /></div>
      </section>
      <section className="card p-6 sm:p-8">
        <h2 className="font-serif text-2xl font-semibold">Пароль</h2>
        <div className="mt-5"><PasswordForm /></div>
      </section>
      <section className="rounded-3xl border-2 border-rose-500/30 p-6 sm:p-8">
        <h2 className="font-serif text-2xl font-semibold text-rose-500">Удаление аккаунта</h2>
        <p className="mt-2 text-sm text-ink-600">
          Если вы единственный хранитель семейного пространства, права перейдут к другому участнику. Если участников больше нет — пространство будет удалено вместе с материалами.
        </p>
        <div className="mt-5"><DeleteAccountForm /></div>
      </section>
    </div>
  );
}

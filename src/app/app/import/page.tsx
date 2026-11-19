import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { AI_PROMPT, IMPORT_EXAMPLE_JSON } from '@/lib/import-format';
import { CopyBlock, ImportForm } from '@/components/app/ImportForm';

export const metadata = { title: 'Загрузка архива' };

export default async function ImportPage({ searchParams }: { searchParams: Promise<{ target?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const memberships = await db.membership.findMany({
    where: { userId: user.id, role: { in: ['OWNER', 'EDITOR'] } },
    include: { family: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/app" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" /> Мои семьи
      </Link>
      <h1 className="h-display mt-6 text-4xl sm:text-5xl">Загрузка архива</h1>
      <p className="mt-4 max-w-2xl text-ink-600">
        Восстановите семью из архива, который вы когда-то скачали в настройках, или загрузите готовый скелет дерева в формате JSON — например, подготовленный по фотографии схемы.
      </p>

      <section className="card mt-8 p-6 sm:p-8">
        <ImportForm families={memberships.map((m) => m.family)} defaultTarget={sp.target ?? 'new'} />
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-3xl font-semibold">Как подготовить JSON-файл дерева</h2>
        <div className="mt-5 grid gap-4 text-ink-700 md:grid-cols-3">
          {[
            { n: 1, t: 'Сфотографируйте схему', d: 'Рукописное дерево, распечатку или скриншот из другого сервиса.' },
            { n: 2, t: 'Попросите ИИ', d: 'Отправьте фото в любой ИИ-ассистент вместе с запросом ниже и сохраните ответ в файл .json.' },
            { n: 3, t: 'Загрузите и проверьте', d: 'Загрузите файл сюда. ИИ может ошибиться в именах и связях — сверьте дерево с оригиналом.' },
          ].map((s) => (
            <div key={s.n} className="rounded-3xl bg-cream-100 p-5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-ink-900 text-sm font-bold text-gold-300">{s.n}</span>
              <p className="mt-3 font-bold">{s.t}</p>
              <p className="mt-1 text-sm text-ink-600">{s.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6">
          <div>
            <h3 className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-gold-600" /> Запрос для ИИ</h3>
            <p className="mt-1 text-sm text-ink-500">Скопируйте целиком и приложите фото схемы.</p>
            <div className="mt-3"><CopyBlock title="Запрос" text={AI_PROMPT} /></div>
          </div>
          <div>
            <h3 className="font-semibold">Формат файла</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-600">
              <li><code>persons</code> — люди: <code>id</code>, <code>firstName</code> (обязательно), <code>lastName</code>, <code>middleName</code>, <code>maidenName</code>, <code>gender</code> (<code>MALE</code> / <code>FEMALE</code> / <code>UNKNOWN</code>), <code>birthDate</code>, <code>deathDate</code>, <code>birthPlace</code>, <code>occupation</code>, <code>bio</code>.</li>
              <li><code>relations</code> — связи: <code>PARENT</code> (from — родитель, to — ребёнок), <code>SPOUSE</code> (супруги), <code>SIBLING</code> (брат или сестра, если родители неизвестны).</li>
              <li>Ошибочные связи не ломают загрузку: лишние родители, циклы и ссылки на несуществующих людей пропускаются, а после загрузки показывается список замечаний.</li>
            </ul>
            <div className="mt-3"><CopyBlock title="Пример: семья-ивановых.json" text={IMPORT_EXAMPLE_JSON} fileName="primer-dereva.json" /></div>
          </div>
        </div>
      </section>
    </div>
  );
}

import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { REG_STATUS_LABEL } from '@/lib/constants';

function cell(v: unknown) {
  let s = String(v ?? '');
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') return new Response('Forbidden', { status: 403 });
  const rows = await db.festivalRegistration.findMany({ orderBy: { createdAt: 'asc' } });
  const head = ['Дата', 'Имя', 'Фамилия семьи', 'Телефон', 'Почта', 'Взрослые', 'Дети', 'Старшее поколение', 'Зоны', 'Комментарий', 'Статус', 'Заметка'];
  const lines = rows.map((r) =>
    [
      r.createdAt.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }),
      r.name, r.familyName, r.phone, r.email, r.adults, r.children, r.seniors, r.zones.join('; '), r.comment, REG_STATUS_LABEL[r.status], r.adminNote,
    ].map(cell).join(';'),
  );
  const csv = '\uFEFF' + [head.map(cell).join(';'), ...lines].join('\r\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="festival-registrations-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

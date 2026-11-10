import fs from 'node:fs';
import { PassThrough, Readable } from 'node:stream';
import archiver from 'archiver';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getMembership, personName } from '@/lib/family';
import { MATERIAL_LABEL } from '@/lib/constants';
import { resolveStoragePath } from '@/lib/storage';
import { slugify } from '@/lib/utils';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: familyId } = await params;
  const user = await getCurrentUser();
  if (!user) return new Response('Unauthorized', { status: 401 });
  const m = await getMembership(familyId, user.id);
  if (!m || m.role !== 'OWNER') return new Response('Forbidden', { status: 403 });

  const family = await db.family.findUnique({
    where: { id: familyId },
    include: {
      persons: { include: { avatar: true } },
      relations: true,
      materials: { include: { file: true, persons: true, comments: { include: { author: { select: { name: true } } } }, author: { select: { name: true } } } },
      members: { include: { user: { select: { name: true, email: true } } } },
    },
  });
  if (!family) return new Response('Not found', { status: 404 });

  const archive = archiver('zip', { zlib: { level: 6 } });
  const pass = new PassThrough();
  archive.pipe(pass);

  const pname = new Map(family.persons.map((p) => [p.id, personName(p)]));
  const data = {
    exportedAt: new Date().toISOString(),
    family: { id: family.id, name: family.name, description: family.description, createdAt: family.createdAt },
    members: family.members.map((x) => ({ name: x.user.name, email: x.user.email, role: x.role })),
    persons: family.persons.map((p) => ({
      id: p.id, firstName: p.firstName, lastName: p.lastName, middleName: p.middleName, maidenName: p.maidenName,
      gender: p.gender, birthDate: p.birthDate, deathDate: p.deathDate, isLiving: p.isLiving, birthPlace: p.birthPlace,
      livedPlaces: p.livedPlaces, occupation: p.occupation, bio: p.bio,
      avatar: p.avatar ? `files/avatars/${p.id}.jpg` : null,
    })),
    relations: family.relations.map((r) => ({ type: r.type, from: r.fromId, to: r.toId, fromName: pname.get(r.fromId), toName: pname.get(r.toId) })),
    materials: family.materials.map((mt) => ({
      id: mt.id, type: mt.type, title: mt.title, body: mt.body, dateText: mt.dateText, place: mt.place, externalUrl: mt.externalUrl,
      visibility: mt.visibility, author: mt.author?.name, createdAt: mt.createdAt,
      persons: mt.persons.map((x) => pname.get(x.personId)),
      file: mt.file ? `files/materials/${mt.id}-${slugify(mt.title) || 'file'}${mt.file.path.slice(mt.file.path.lastIndexOf('.'))}` : null,
      comments: mt.comments.map((c) => ({ author: c.author.name, text: c.text, createdAt: c.createdAt })),
    })),
  };
  archive.append(JSON.stringify(data, null, 2), { name: 'family.json' });

  const lines = [`# ${family.name}`, '', `Выгрузка от ${new Date().toLocaleString('ru-RU')}`, '', '## Родственники', ''];
  for (const p of family.persons) {
    lines.push(`- ${personName(p)}${p.birthDate ? `, род. ${p.birthDate}` : ''}${p.deathDate ? `, ум. ${p.deathDate}` : ''}`);
    if (p.bio) lines.push(`  ${p.bio.replace(/\n/g, '\n  ')}`);
  }
  lines.push('', '## Материалы', '');
  for (const mt of family.materials) {
    lines.push(`### ${MATERIAL_LABEL[mt.type]}: ${mt.title}`);
    if (mt.dateText || mt.place) lines.push(`_${[mt.dateText, mt.place].filter(Boolean).join(', ')}_`);
    if (mt.body) lines.push('', mt.body);
    lines.push('');
  }
  archive.append(lines.join('\n'), { name: 'Летопись.md' });

  for (const p of family.persons) {
    if (!p.avatar) continue;
    try {
      const full = resolveStoragePath(p.avatar.path);
      if (fs.existsSync(full)) archive.file(full, { name: `files/avatars/${p.id}.jpg` });
    } catch {}
  }
  for (const mt of data.materials) {
    const src = family.materials.find((x) => x.id === mt.id)?.file;
    if (!src || !mt.file) continue;
    try {
      const full = resolveStoragePath(src.path);
      if (fs.existsSync(full)) archive.file(full, { name: mt.file });
    } catch {}
  }
  void archive.finalize();

  const name = `golos-roda-${slugify(family.name) || 'family'}-${new Date().toISOString().slice(0, 10)}.zip`;
  return new Response(Readable.toWeb(pass) as ReadableStream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${name}"`,
      'Cache-Control': 'no-store',
    },
  });
}

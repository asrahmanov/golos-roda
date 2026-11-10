import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { hashToken } from '@/lib/email-tokens';
import { siteUrl } from '@/lib/mail';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || '';
  const row = token ? await db.emailToken.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } }) : null;

  if (!row || row.kind !== 'VERIFY' || row.user.isBlocked) {
    return NextResponse.redirect(siteUrl('/login?verify=invalid'));
  }
  if (row.usedAt || row.user.emailVerifiedAt) {
    return NextResponse.redirect(siteUrl('/login?verify=done'));
  }
  if (row.expiresAt < new Date()) {
    return NextResponse.redirect(siteUrl('/verify-email?expired=1'));
  }

  const now = new Date();
  await db.$transaction([
    db.emailToken.update({ where: { id: row.id }, data: { usedAt: now } }),
    db.user.update({ where: { id: row.userId }, data: { emailVerifiedAt: now } }),
  ]);
  await createSession(row.user.id, row.user.sessionVer);
  const next = row.next && row.next.startsWith('/') && !row.next.startsWith('//') && row.next !== '/app' ? row.next : '/app?welcome=1';
  return NextResponse.redirect(siteUrl(next));
}

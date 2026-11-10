import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { db } from './db';
import { sendResetEmail, sendVerifyEmail, siteUrl } from './mail';

const TTL = { VERIFY: 48 * 3600 * 1000, RESET: 2 * 3600 * 1000 } as const;

export const hashToken = (t: string) => createHash('sha256').update(t).digest('hex');

async function issue(userId: string, kind: 'VERIFY' | 'RESET', next?: string | null) {
  await db.emailToken.deleteMany({ where: { userId, kind, usedAt: null } });
  const token = randomBytes(32).toString('base64url');
  await db.emailToken.create({
    data: { userId, kind, tokenHash: hashToken(token), next: next || null, expiresAt: new Date(Date.now() + TTL[kind]) },
  });
  return token;
}

export async function sendVerification(user: { id: string; email: string; name: string }, next?: string | null) {
  const token = await issue(user.id, 'VERIFY', next);
  await sendVerifyEmail(user.email, user.name, siteUrl(`/api/auth/verify?token=${token}`));
}

export async function sendPasswordReset(user: { id: string; email: string; name: string }) {
  const token = await issue(user.id, 'RESET');
  await sendResetEmail(user.email, user.name, siteUrl(`/reset/${token}`));
}

export async function findValidToken(token: string, kind: 'VERIFY' | 'RESET') {
  const row = await db.emailToken.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!row || row.kind !== kind || row.usedAt || row.expiresAt < new Date() || row.user.isBlocked) return null;
  return row;
}

import type { Metadata } from 'next';
import { getSettings } from '@/lib/settings';
import { LegalPage } from '@/components/site/LegalPage';

export const metadata: Metadata = { title: 'Политика конфиденциальности' };

export default async function PrivacyPage() {
  const s = await getSettings();
  return <LegalPage title="Политика конфиденциальности" text={s.privacyText} updated={s.privacyUpdated} email={s.contactEmail} />;
}

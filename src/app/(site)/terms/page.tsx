import type { Metadata } from 'next';
import { getSettings } from '@/lib/settings';
import { LegalPage } from '@/components/site/LegalPage';

export const metadata: Metadata = { title: 'Условия использования' };

export default async function TermsPage() {
  const s = await getSettings();
  return <LegalPage title="Условия использования" text={s.termsText} updated={s.termsUpdated} email={s.contactEmail} />;
}

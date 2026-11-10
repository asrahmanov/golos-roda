import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { Interactions } from '@/components/site/Interactions';
import { getCurrentUser } from '@/lib/auth';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  return (
    <Interactions>
      <SiteHeader loggedIn={!!user} announcement={settings.announcement || undefined} />
      <main>{children}</main>
      <SiteFooter settings={settings} />
    </Interactions>
  );
}

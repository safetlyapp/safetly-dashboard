import type { Metadata } from 'next';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { SeoSettingsForm } from '@/components/dashboard/seo-settings-form';
import { db } from '@/db';
import { admins, seoSettings } from '@/db/schema';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'SEO Settings',
  description: 'Manage Safetly website SEO settings.',
};

export default async function SeoPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const [admin] = await db()
    .select({ id: admins.id })
    .from(admins)
    .where(eq(admins.id, session.sub))
    .limit(1);
  if (!admin) redirect('/login');
  const [settings] = await db().select().from(seoSettings).limit(1);
  return (
    <SeoSettingsForm
      initialSettings={
        settings ?? {
          homepageTitle: 'Safetly | Smart Parental Control & Family Safety',
          homepageDescription:
            'Safetly helps parents keep children safer with parental controls, screen-time tools, location monitoring, and family protection.',
          keywords: [
            'parental control app',
            'family safety app',
            'child safety',
            'Safetly',
          ],
          ogImage: '/hero.png',
          twitterTitle: 'Safetly | Smart Parental Control & Family Safety',
          canonicalSiteUrl: 'https://safetly.app',
        }
      }
    />
  );
}

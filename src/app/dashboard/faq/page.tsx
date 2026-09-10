import type { Metadata } from 'next';
import { asc, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { FaqAdmin } from '@/components/dashboard/faq-admin';
import { db } from '@/db';
import { admins, faqCategories, faqItems } from '@/db/schema';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Manage FAQ categories and items',
};

export default async function FaqPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [admin] = await db()
    .select({ id: admins.id })
    .from(admins)
    .where(eq(admins.id, session.sub))
    .limit(1);
  if (!admin) redirect('/login');

  const categories = await db()
    .select()
    .from(faqCategories)
    .orderBy(asc(faqCategories.displayOrder), asc(faqCategories.title));
  const items = await db()
    .select()
    .from(faqItems)
    .orderBy(asc(faqItems.displayOrder));

  return (
    <FaqAdmin
      initialCategories={categories.map((category) => ({
        ...category,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
      }))}
      initialItems={items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      }))}
    />
  );
}

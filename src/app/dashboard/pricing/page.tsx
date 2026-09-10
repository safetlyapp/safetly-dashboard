import type { Metadata } from 'next';
import { asc, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { PricingAdmin } from '@/components/dashboard/pricing-admin';
import { db } from '@/db';
import { admins, pricingPlans } from '@/db/schema';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Manage pricing plans',
};

export default async function PricingPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [admin] = await db()
    .select({ id: admins.id })
    .from(admins)
    .where(eq(admins.id, session.sub))
    .limit(1);
  if (!admin) redirect('/login');

  const plans = await db()
    .select()
    .from(pricingPlans)
    .orderBy(asc(pricingPlans.displayOrder), asc(pricingPlans.name));

  return (
    <PricingAdmin
      initialPlans={plans.map((plan) => ({
        ...plan,
        createdAt: plan.createdAt.toISOString(),
        updatedAt: plan.updatedAt.toISOString(),
      }))}
    />
  );
}

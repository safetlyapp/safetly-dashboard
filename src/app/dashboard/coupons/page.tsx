import type { Metadata } from 'next';
import { desc, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { CouponsAdmin } from '@/components/dashboard/coupons-admin';
import { db } from '@/db';
import { admins, coupons } from '@/db/schema';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Coupons',
  description: 'Manage coupon usage and limits',
};

export default async function CouponsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [admin] = await db()
    .select({ id: admins.id })
    .from(admins)
    .where(eq(admins.id, session.sub))
    .limit(1);
  if (!admin) redirect('/login');

  const rows = await db()
    .select()
    .from(coupons)
    .orderBy(desc(coupons.createdAt));

  return (
    <CouponsAdmin
      initialCoupons={rows.map((coupon) => ({
        ...coupon,
        expiresAt: coupon.expiresAt?.toISOString() ?? null,
      }))}
    />
  );
}

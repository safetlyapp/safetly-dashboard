import type { Metadata } from 'next';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';
import { db } from '@/db';
import { admins } from '@/db/schema';
import { getSession } from '@/lib/auth/session';
import { getExternalParentChildren } from '@/lib/parent-child-api';
import { getDashboardPaymentStats } from '@/lib/dashboard-stats';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Administrator dashboard',
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const [admin] = await db()
    .select({
      id: admins.id,
      email: admins.email,
      createdAt: admins.createdAt,
    })
    .from(admins)
    .where(eq(admins.id, session.sub))
    .limit(1);

  if (!admin) {
    redirect('/login');
  }

  const externalParents = await getExternalParentChildren().catch(() => null);
  const paymentStats = await getDashboardPaymentStats();
  const externalChildren = externalParents?.flatMap((parent) => parent.children) ?? [];

  return (
    <AdminDashboard
      id={admin.id}
      email={admin.email}
      createdAt={admin.createdAt.toISOString()}
      stats={{
        parents: externalParents?.length ?? 0,
        children: externalChildren.length,
        premium: externalChildren.filter((child) => child.isPremium).length,
        trial: externalChildren.filter((child) => !child.isPremium).length,
        payments: paymentStats.total,
        approvedPayments: paymentStats.approved,
      }}
    />
  );
}

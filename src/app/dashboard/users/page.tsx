import type { Metadata } from 'next';
import { desc, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { UsersAdmin } from '@/components/dashboard/users-admin';
import { db } from '@/db';
import {
  admins,
  children,
  parents,
  paymentRecords,
  pricingPlans,
  subscriptions,
} from '@/db/schema';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Users & subscriptions',
  description: 'Manage parents, children, subscriptions, and revenue',
};

export default async function UsersPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const [admin] = await db()
    .select({ id: admins.id })
    .from(admins)
    .where(eq(admins.id, session.sub))
    .limit(1);
  if (!admin) redirect('/login');
  const childRows = await db()
    .select({ child: children, parent: parents })
    .from(children)
    .innerJoin(parents, eq(children.parentId, parents.id))
    .orderBy(desc(children.createdAt));
  const subscriptionRows = await db()
    .select()
    .from(subscriptions)
    .orderBy(desc(subscriptions.createdAt));
  const plans = await db()
    .select({
      planId: pricingPlans.planId,
      name: pricingPlans.name,
      price: pricingPlans.price,
    })
    .from(pricingPlans)
    .where(eq(pricingPlans.isActive, true))
    .orderBy(pricingPlans.displayOrder);
  const latestSubscriptions = new Map<
    string,
    (typeof subscriptionRows)[number]
  >();
  for (const subscription of subscriptionRows) {
    if (!latestSubscriptions.has(subscription.childId))
      latestSubscriptions.set(subscription.childId, subscription);
  }
  const payments = await db()
    .select({
      customerEmail: paymentRecords.customerEmail,
      amount: paymentRecords.verifiedAmount,
      submitted: paymentRecords.submittedAmount,
      status: paymentRecords.status,
    })
    .from(paymentRecords);
  const revenue = payments
    .filter((payment) => payment.status === 'approved')
    .reduce(
      (total, payment) => total + Number(payment.amount ?? payment.submitted),
      0
    );
  const paidByEmail = new Map<string, number>();
  for (const payment of payments)
    if (payment.status === 'approved')
      paidByEmail.set(
        payment.customerEmail,
        (paidByEmail.get(payment.customerEmail) ?? 0) +
          Number(payment.amount ?? payment.submitted)
      );
  return (
    <UsersAdmin
      revenue={revenue}
      plans={plans}
      children={childRows.map(({ child, parent }) => {
        const subscription = latestSubscriptions.get(child.id);
        return {
          id: child.id,
          name: child.username,
          username: child.username,
          email: child.email,
          parentName: parent.name,
          parentEmail: parent.email,
          totalPaid: paidByEmail.get(child.email) ?? 0,
          subscription: subscription
            ? {
                packageName: subscription.packageName,
                amount: subscription.amount,
                expiresAt: subscription.expiresAt.toISOString(),
                status: subscription.status,
              }
            : null,
        };
      })}
    />
  );
}

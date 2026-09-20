import { count, eq } from 'drizzle-orm';
import { db } from '@/db';
import { paymentRecords } from '@/db/schema';

// Small overview query for the admin home page; detailed reporting stays on /dashboard/payments.
export async function getDashboardPaymentStats() {
  const [{ total }] = await db().select({ total: count() }).from(paymentRecords);
  const [{ approved }] = await db()
    .select({ approved: count() })
    .from(paymentRecords)
    .where(eq(paymentRecords.status, 'approved'));
  return { total: Number(total), approved: Number(approved) };
}

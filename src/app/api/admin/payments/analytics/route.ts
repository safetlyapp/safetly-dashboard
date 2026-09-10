import { and, gte, lt } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { paymentRecords } from '@/db/schema';
import { requireAdmin } from '@/lib/api/admin-auth';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const requested = request.nextUrl.searchParams.get('month') ?? '';
  const month = /^\d{4}-\d{2}$/.test(requested)
    ? requested
    : new Date().toISOString().slice(0, 7);
  const [year, monthNumber] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 1));
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const records = await db()
    .select({
      status: paymentRecords.status,
      amount: paymentRecords.verifiedAmount,
      submitted: paymentRecords.submittedAmount,
      createdAt: paymentRecords.createdAt,
    })
    .from(paymentRecords)
    .where(
      and(
        gte(paymentRecords.createdAt, start),
        lt(paymentRecords.createdAt, end)
      )
    );

  const days = Array.from({ length: daysInMonth }, (_, index) => ({
    day: index + 1,
    total: 0,
    approved: 0,
    failed: 0,
    amount: 0,
    revenue: 0,
  }));
  for (const record of records) {
    const day = record.createdAt.getUTCDate();
    const item = days[day - 1];
    if (!item) continue;
    item.total += 1;
    item.amount += Number(record.amount ?? record.submitted);
    if (record.status === 'approved') {
      item.approved += 1;
      item.revenue += Number(record.amount ?? record.submitted);
    } else {
      item.failed += 1;
    }
  }

  const approvedRecords = records.filter(
    (record) => record.status === 'approved'
  );
  const approvedAmount = approvedRecords.reduce(
    (sum, record) => sum + Number(record.amount ?? record.submitted),
    0
  );
  return NextResponse.json({
    month,
    days,
    summary: {
      total: records.length,
      approved: approvedRecords.length,
      failed: records.length - approvedRecords.length,
      totalAmount: approvedAmount,
      revenue: approvedAmount,
    },
  });
}

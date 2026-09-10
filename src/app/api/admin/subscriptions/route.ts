import { desc, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { children, subscriptions } from '@/db/schema';
import { requireAdmin } from '@/lib/api/admin-auth';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object')
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const value = body as Record<string, unknown>;
  const childId = typeof value.childId === 'string' ? value.childId : '';
  const packageName =
    typeof value.packageName === 'string' ? value.packageName.trim() : '';
  const amount =
    typeof value.amount === 'string'
      ? value.amount
      : String(value.amount ?? '');
  const discountAmount =
    typeof value.discountAmount === 'string'
      ? value.discountAmount
      : String(value.discountAmount ?? '0');
  const expiresAt =
    typeof value.expiresAt === 'string' ? new Date(value.expiresAt) : null;
  if (
    !childId ||
    !packageName ||
    !/^\d+(\.\d{1,2})?$/.test(amount) ||
    !expiresAt ||
    Number.isNaN(expiresAt.getTime())
  )
    return NextResponse.json(
      { error: 'Child, package, amount, and expiry are required.' },
      { status: 400 }
    );
  const [child] = await db()
    .select({ id: children.id })
    .from(children)
    .where(eq(children.id, childId))
    .limit(1);
  if (!child)
    return NextResponse.json({ error: 'Child not found.' }, { status: 404 });
  const subscription = await db().transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.childId, childId))
      .orderBy(desc(subscriptions.expiresAt))
      .limit(1);
    const now = new Date();
    const effectiveStart =
      current && current.expiresAt > now ? current.expiresAt : now;
    const [created] = await tx
      .insert(subscriptions)
      .values({
        childId,
        packageName,
        amount,
        discountAmount,
        startsAt: effectiveStart,
        expiresAt,
      })
      .returning();
    await tx
      .update(children)
      .set({ expireDate: expiresAt })
      .where(eq(children.id, childId));
    return created;
  });
  return NextResponse.json({ subscription }, { status: 201 });
}

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
    .where(eq(children.email, childId.toLowerCase()))
    .limit(1);
  if (!child) {
    const externalBaseUrl = process.env.PARENT_CHILD_API_URL?.trim();
    const externalToken = process.env.PARENT_CHILD_API_TOKEN?.trim();
    const planId = typeof value.planId === 'string' ? value.planId : '';
    if (!externalBaseUrl || !externalToken || !childId.includes('@'))
      return NextResponse.json({ error: 'Child not found.' }, { status: 404 });

    try {
      const listResponse = await fetch(new URL('/api/admin/parent-child', externalBaseUrl), {
        headers: { Accept: 'application/json', Authorization: `Bearer ${externalToken}` },
        cache: 'no-store',
      });
      const payload = (await listResponse.json()) as { parents?: Array<{ children?: Array<{ id?: string; email?: string; expireDate?: string | null }> }> };
      const externalChild = (payload.parents ?? [])
        .flatMap((parent) => parent.children ?? [])
        .find((candidate) => candidate.email?.toLowerCase() === childId.toLowerCase());
      if (!listResponse.ok || !externalChild?.id || !externalChild.email)
        return NextResponse.json({ error: 'External child not found.' }, { status: 404 });

      const durationDays = planId === 'quarterly' ? 90 : planId === 'half-yearly' ? 180 : planId === 'yearly' ? 360 : 30;
      const now = new Date();
      const currentExpiry = externalChild.expireDate ? new Date(externalChild.expireDate) : null;
      const nextExpiry = currentExpiry && currentExpiry > now ? currentExpiry : now;
      nextExpiry.setUTCDate(nextExpiry.getUTCDate() + durationDays);
      const syncResponse = await fetch(new URL(`/api/child/${encodeURIComponent(externalChild.id)}/premium`, externalBaseUrl), {
        method: 'PATCH',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${externalToken}` },
        body: JSON.stringify({ email: externalChild.email, expireDate: nextExpiry.toISOString() }),
        cache: 'no-store',
      });
      if (!syncResponse.ok) return NextResponse.json({ error: 'Could not update external child expiry.' }, { status: 502 });
      return NextResponse.json({ subscription: { packageName, amount, discountAmount, expiresAt: nextExpiry.toISOString(), status: 'active' } }, { status: 201 });
    } catch {
      return NextResponse.json({ error: 'External Parent/Child API is unavailable.' }, { status: 503 });
    }
  }
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

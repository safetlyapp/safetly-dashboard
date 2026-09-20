import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { children, paymentRecords, subscriptions } from '@/db/schema';
import { sendPaymentStatusEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  const internalKey = process.env.INTERNAL_API_SECRET;
  if (
    !internalKey ||
    request.headers.get('x-internal-api-key') !== internalKey
  ) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const email = normalizeEmail(
    request.nextUrl.searchParams.get('customerEmail')
  );
  if (!email) {
    return NextResponse.json(
      { error: 'customerEmail is required.' },
      { status: 400 }
    );
  }

  const records = await db()
    .select()
    .from(paymentRecords)
    .where(eq(paymentRecords.customerEmail, email))
    .orderBy(desc(paymentRecords.createdAt));

  return NextResponse.json({ records });
}

export async function POST(request: NextRequest) {
  const internalKey = process.env.INTERNAL_API_SECRET;
  if (
    !internalKey ||
    request.headers.get('x-internal-api-key') !== internalKey
  ) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object')
    return NextResponse.json(
      { error: 'Invalid payment record.' },
      { status: 400 }
    );
  const value = body as Record<string, unknown>;
  const required = [
    'orderId',
    'trxId',
    'customerEmail',
    'senderPhoneNumber',
    'submittedAmount',
    'status',
  ];
  if (!required.every((key) => typeof value[key] === 'string' && value[key]))
    return NextResponse.json(
      { error: 'Missing payment record fields.' },
      { status: 400 }
    );

  const customerEmail = normalizeEmail(value.customerEmail);
  if (!customerEmail) {
    return NextResponse.json(
      { error: 'A valid customer email is required.' },
      { status: 400 }
    );
  }

  const [existingRecord] = await db()
    .select({ status: paymentRecords.status })
    .from(paymentRecords)
    .where(eq(paymentRecords.orderId, value.orderId as string))
    .limit(1);

  const [record] = await db()
    .insert(paymentRecords)
    .values({
      orderId: value.orderId as string,
      trxId: value.trxId as string,
      planId: typeof value.planId === 'string' ? value.planId : null,
      packageName:
        typeof value.packageName === 'string' ? value.packageName : null,
      customerEmail,
      senderPhoneNumber: value.senderPhoneNumber as string,
      originalAmount:
        typeof value.originalAmount === 'string' ? value.originalAmount : null,
      discountAmount:
        typeof value.discountAmount === 'string' ? value.discountAmount : null,
      submittedAmount: value.submittedAmount as string,
      verifiedAmount:
        typeof value.verifiedAmount === 'string' ? value.verifiedAmount : null,
      status: value.status as
        | 'approved'
        | 'pending'
        | 'held_for_review'
        | 'manual_review'
        | 'rejected'
        | 'reversed'
        | 'already_claimed',
      payconfirmStatus:
        typeof value.payconfirmStatus === 'string'
          ? value.payconfirmStatus
          : null,
      payconfirmReason:
        typeof value.payconfirmReason === 'string'
          ? value.payconfirmReason
          : null,
      payconfirmResponse: value.payconfirmResponse,
      verifiedAt: value.verifiedAt
        ? new Date(value.verifiedAt as string)
        : null,
    })
    .onConflictDoUpdate({
      target: paymentRecords.orderId,
      set: {
        status: value.status as
          | 'approved'
          | 'pending'
          | 'held_for_review'
          | 'manual_review'
          | 'rejected'
          | 'reversed'
          | 'already_claimed',
        verifiedAmount:
          typeof value.verifiedAmount === 'string'
            ? value.verifiedAmount
            : null,
        payconfirmStatus:
          typeof value.payconfirmStatus === 'string'
            ? value.payconfirmStatus
            : null,
        payconfirmReason:
          typeof value.payconfirmReason === 'string'
            ? value.payconfirmReason
            : null,
        payconfirmResponse: value.payconfirmResponse,
        verifiedAt: value.verifiedAt
          ? new Date(value.verifiedAt as string)
          : null,
        planId: typeof value.planId === 'string' ? value.planId : null,
        packageName:
          typeof value.packageName === 'string' ? value.packageName : null,
        originalAmount:
          typeof value.originalAmount === 'string'
            ? value.originalAmount
            : null,
        discountAmount:
          typeof value.discountAmount === 'string'
            ? value.discountAmount
            : null,
      },
    })
    .returning();

  let emailSent = false;
  try {
    emailSent = await sendPaymentStatusEmail({
      orderId: record.orderId,
      trxId: record.trxId,
      customerEmail: record.customerEmail,
      amount: record.verifiedAmount ?? record.submittedAmount,
      status: record.status,
      reason: record.payconfirmReason,
    });
  } catch (error) {
    console.error('Payment email could not be sent:', error);
  }

  if (record.status === 'approved' && existingRecord?.status !== 'approved') {
    await activateSubscription({
      customerEmail: record.customerEmail,
      planId: typeof value.planId === 'string' ? value.planId : null,
      packageName:
        typeof value.packageName === 'string'
          ? value.packageName
          : 'Safetly subscription',
      amount: record.verifiedAmount ?? record.submittedAmount,
      discountAmount:
        typeof value.discountAmount === 'string' ? value.discountAmount : '0',
    });
  }

  return NextResponse.json({ record, emailSent });
}

async function activateSubscription(input: {
  customerEmail: string;
  planId: string | null;
  packageName: string;
  amount: string;
  discountAmount: string;
}) {
  const [child] = await db()
    .select()
    .from(children)
    .where(eq(children.email, input.customerEmail.toLowerCase()))
    .limit(1);
  if (!child) {
    console.warn(
      '[subscription.activate] child not found',
      input.customerEmail
    );
    return;
  }

  const durationDays =
    input.planId === 'quarterly'
      ? 90
      : input.planId === 'half-yearly'
        ? 180
        : input.planId === 'yearly'
          ? 360
          : 30;
  const now = new Date();
  const [current] = await db()
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.childId, child.id))
    .orderBy(desc(subscriptions.expiresAt))
    .limit(1);
  const startsAt = current && current.expiresAt > now ? current.expiresAt : now;
  const expiresAt = new Date(startsAt);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + durationDays);

  await db().transaction(async (tx) => {
    await tx.insert(subscriptions).values({
      childId: child.id,
      packageName: input.packageName,
      amount: input.amount,
      discountAmount: input.discountAmount,
      startsAt,
      expiresAt,
      status: 'active',
    });
    await tx
      .update(children)
      .set({ expireDate: expiresAt })
      .where(eq(children.id, child.id));
  });

  const externalBaseUrl = process.env.PARENT_CHILD_API_URL?.trim();
  const externalToken = process.env.PARENT_CHILD_API_TOKEN?.trim();
  if (!externalBaseUrl || !externalToken) {
    console.info(
      '[subscription.activate] external sync skipped: API not configured'
    );
    return;
  }

  try {
    const response = await fetch(
      new URL(
        `/api/child/${encodeURIComponent(child.id)}/premium`,
        externalBaseUrl
      ),
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${externalToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: child.email,
          expireDate: expiresAt.toISOString(),
        }),
        cache: 'no-store',
      }
    );
    if (!response.ok) {
      console.error('[subscription.activate] external expiry sync failed', {
        childId: child.id,
        status: response.status,
      });
    } else {
      console.info('[subscription.activate] external expiry sync complete', {
        childId: child.id,
        expireDate: expiresAt.toISOString(),
      });
    }
  } catch (error) {
    console.error(
      '[subscription.activate] external expiry sync unavailable',
      error
    );
  }
}

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

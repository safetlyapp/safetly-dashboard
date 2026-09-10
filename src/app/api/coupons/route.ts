import { desc } from 'drizzle-orm';
import { type NextRequest } from 'next/server';
import { db } from '@/db';
import { coupons } from '@/db/schema';
import { requireAdmin } from '@/lib/api/admin-auth';
import {
  badRequest,
  conflict,
  created,
  ok,
  parseBoolean,
  parseInteger,
  parseString,
  readJsonObject,
} from '@/lib/api/request';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const rows = await db()
    .select()
    .from(coupons)
    .orderBy(desc(coupons.createdAt));

  return ok({ coupons: rows });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const payload = await readJsonObject(request);
  if ('response' in payload) return payload.response;

  const code = parseString(payload.body.code)?.toUpperCase();
  const discountType = parseString(payload.body.discountType);
  const discountValue = parseString(payload.body.discountValue);
  const maxUsageTotal =
    payload.body.maxUsageTotal === null || payload.body.maxUsageTotal === ''
      ? null
      : parseInteger(payload.body.maxUsageTotal);
  const expiresAtRaw =
    payload.body.expiresAt === null || payload.body.expiresAt === ''
      ? null
      : parseString(payload.body.expiresAt);
  const isActive =
    payload.body.isActive === undefined
      ? true
      : parseBoolean(payload.body.isActive);

  if (
    !code ||
    !discountValue ||
    (discountType !== 'percentage' && discountType !== 'flat')
  )
    return badRequest('Code, discount type, and discount value are required.');
  if (!/^\d+(\.\d{1,2})?$/.test(discountValue) || Number(discountValue) <= 0)
    return badRequest('discountValue must be a positive number.');
  if (maxUsageTotal !== null && (maxUsageTotal === null || maxUsageTotal < 1))
    return badRequest('maxUsageTotal must be a positive integer or empty.');
  if (isActive === null) return badRequest('isActive must be a boolean.');
  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;
  if (expiresAtRaw && (!expiresAt || Number.isNaN(expiresAt.getTime())))
    return badRequest('expiresAt must be a valid date.');

  try {
    const [coupon] = await db()
      .insert(coupons)
      .values({
        code,
        discountType,
        discountValue,
        maxUsageTotal,
        expiresAt,
        isActive,
      })
      .returning();
    return created({ coupon });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    )
      return conflict('A coupon with this code already exists.');
    throw error;
  }
}

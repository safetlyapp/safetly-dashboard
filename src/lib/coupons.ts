import { and, eq, isNull, lt, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import { couponUsages, coupons } from '@/db/schema';

export type CouponDiscount = {
  couponId: string;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: string;
};

export type CouponApplySuccess = {
  ok: true;
  discount: CouponDiscount;
};

export type CouponApplyErrorCode =
  | 'INVALID_CODE'
  | 'INACTIVE'
  | 'EXPIRED'
  | 'USAGE_LIMIT_REACHED'
  | 'ALREADY_USED'
  | 'INVALID_USER'
  | 'INTERNAL_ERROR';

export type CouponApplyFailure = {
  ok: false;
  code: CouponApplyErrorCode;
  error: string;
};

export type CouponApplyResult = CouponApplySuccess | CouponApplyFailure;

class CouponError extends Error {
  constructor(
    public readonly code: Exclude<CouponApplyErrorCode, 'INTERNAL_ERROR'>,
    message: string
  ) {
    super(message);
    this.name = 'CouponError';
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  );
}

export async function applyCoupon(
  userId: string,
  couponCode: string
): Promise<CouponApplyResult> {
  if (!userId.trim()) {
    return {
      ok: false,
      code: 'INVALID_USER',
      error: 'A valid user is required.',
    };
  }

  if (!couponCode.trim()) {
    return {
      ok: false,
      code: 'INVALID_CODE',
      error: 'A coupon code is required.',
    };
  }

  try {
    return await db().transaction(async (tx): Promise<CouponApplySuccess> => {
      const [coupon] = await tx
        .select()
        .from(coupons)
        .where(eq(coupons.code, couponCode.trim()))
        .limit(1);

      if (!coupon)
        throw new CouponError('INVALID_CODE', 'Coupon code is invalid.');
      if (!coupon.isActive)
        throw new CouponError('INACTIVE', 'This coupon is no longer active.');
      if (coupon.expiresAt && coupon.expiresAt <= new Date()) {
        throw new CouponError('EXPIRED', 'This coupon has expired.');
      }
      if (
        coupon.maxUsageTotal !== null &&
        coupon.usageCount >= coupon.maxUsageTotal
      ) {
        throw new CouponError(
          'USAGE_LIMIT_REACHED',
          'This coupon has reached its usage limit.'
        );
      }

      try {
        await tx.insert(couponUsages).values({ couponId: coupon.id, userId });
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new CouponError(
            'ALREADY_USED',
            'This coupon has already been used by this user.'
          );
        }
        throw error;
      }

      // The conditional update closes the max-usage race between concurrent users.
      const [updatedCoupon] = await tx
        .update(coupons)
        .set({ usageCount: sql`${coupons.usageCount} + 1` })
        .where(
          and(
            eq(coupons.id, coupon.id),
            eq(coupons.isActive, true),
            or(
              isNull(coupons.maxUsageTotal),
              lt(coupons.usageCount, coupons.maxUsageTotal)
            )
          )
        )
        .returning();

      if (!updatedCoupon) {
        throw new CouponError(
          'USAGE_LIMIT_REACHED',
          'This coupon has reached its usage limit.'
        );
      }

      return {
        ok: true,
        discount: {
          couponId: updatedCoupon.id,
          code: updatedCoupon.code,
          discountType: updatedCoupon.discountType,
          discountValue: updatedCoupon.discountValue,
        },
      };
    });
  } catch (error) {
    if (error instanceof CouponError) {
      return { ok: false, code: error.code, error: error.message };
    }

    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'Unable to apply the coupon right now. Please try again.',
    };
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { applyCoupon } from '@/lib/coupons';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === 'string' ? body.userId.trim() : '';
  const couponCode =
    typeof body?.couponCode === 'string' ? body.couponCode.trim() : '';

  const result = await applyCoupon(userId, couponCode);
  if (!result.ok) {
    const status =
      result.code === 'ALREADY_USED'
        ? 409
        : result.code === 'INVALID_CODE'
          ? 404
          : result.code === 'INTERNAL_ERROR'
            ? 500
            : 400;
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status }
    );
  }

  return NextResponse.json({ coupon: result.discount });
}

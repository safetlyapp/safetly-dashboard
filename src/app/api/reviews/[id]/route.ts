import { eq } from 'drizzle-orm';
import { type NextRequest } from 'next/server';
import { db } from '@/db';
import { reviews } from '@/db/schema';
import { requireAdmin } from '@/lib/api/admin-auth';
import {
  badRequest,
  noContent,
  notFound,
  ok,
  parseBoolean,
  parseInteger,
  parseString,
  readJsonObject,
} from '@/lib/api/request';

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function parseStatus(
  value: unknown
): 'pending' | 'approved' | 'rejected' | null {
  const status = parseString(value);
  if (status === 'pending' || status === 'approved' || status === 'rejected') {
    return status;
  }
  return null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const { id } = await context.params;
  if (!isUuidLike(id)) return notFound();

  const [review] = await db()
    .select()
    .from(reviews)
    .where(eq(reviews.id, id))
    .limit(1);

  if (!review) return notFound();
  return ok({ review });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const { id } = await context.params;
  if (!isUuidLike(id)) return notFound();

  const payload = await readJsonObject(request);
  if ('response' in payload) return payload.response;

  const data: Record<string, unknown> = {};

  if (payload.body.name !== undefined) {
    const name = parseString(payload.body.name);
    if (!name) return badRequest('name must be a non-empty string.');
    data.name = name;
  }
  if (payload.body.quote !== undefined) {
    const quote = parseString(payload.body.quote);
    if (!quote) return badRequest('quote must be a non-empty string.');
    data.quote = quote;
  }
  if (payload.body.rating !== undefined) {
    const rating = parseInteger(payload.body.rating);
    if (rating === null || rating < 1 || rating > 5) {
      return badRequest('rating must be an integer between 1 and 5.');
    }
    data.rating = rating;
  }
  if (payload.body.reviewDate !== undefined) {
    const reviewDateRaw = parseString(payload.body.reviewDate);
    if (!reviewDateRaw)
      return badRequest('reviewDate must be a valid date string.');
    const reviewDate = new Date(reviewDateRaw);
    if (Number.isNaN(reviewDate.getTime())) {
      return badRequest('reviewDate must be a valid date string.');
    }
    data.reviewDate = reviewDate;
  }
  if (payload.body.initials !== undefined) {
    const initials = parseString(payload.body.initials);
    if (!initials) return badRequest('initials must be a non-empty string.');
    data.initials = initials;
  }
  if (payload.body.status !== undefined) {
    const status = parseStatus(payload.body.status);
    if (!status) {
      return badRequest('status must be pending, approved, or rejected.');
    }
    data.status = status;
  }
  if (payload.body.isFeatured !== undefined) {
    const isFeatured = parseBoolean(payload.body.isFeatured);
    if (isFeatured === null) return badRequest('isFeatured must be a boolean.');
    data.isFeatured = isFeatured;
  }
  if (payload.body.displayOrder !== undefined) {
    const displayOrder = parseInteger(payload.body.displayOrder);
    if (displayOrder === null)
      return badRequest('displayOrder must be an integer.');
    data.displayOrder = displayOrder;
  }

  if (Object.keys(data).length === 0) {
    return badRequest('Provide at least one field to update.');
  }

  const [review] = await db()
    .update(reviews)
    .set(data)
    .where(eq(reviews.id, id))
    .returning();

  if (!review) return notFound();
  return ok({ review });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const { id } = await context.params;
  if (!isUuidLike(id)) return notFound();

  const [deleted] = await db()
    .delete(reviews)
    .where(eq(reviews.id, id))
    .returning({ id: reviews.id });

  if (!deleted) return notFound();
  return noContent();
}

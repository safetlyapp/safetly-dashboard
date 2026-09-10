import { eq } from 'drizzle-orm';
import { type NextRequest } from 'next/server';
import { db } from '@/db';
import { faqCategories, faqItems } from '@/db/schema';
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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const { id } = await context.params;
  if (!isUuidLike(id)) return notFound();

  const [item] = await db()
    .select()
    .from(faqItems)
    .where(eq(faqItems.id, id))
    .limit(1);

  if (!item) return notFound();
  return ok({ item });
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

  if (payload.body.categoryId !== undefined) {
    const categoryId = parseString(payload.body.categoryId);
    if (!categoryId)
      return badRequest('categoryId must be a non-empty string.');
    const [category] = await db()
      .select({ id: faqCategories.id })
      .from(faqCategories)
      .where(eq(faqCategories.id, categoryId))
      .limit(1);
    if (!category) return notFound('FAQ category not found.');
    data.categoryId = categoryId;
  }
  if (payload.body.question !== undefined) {
    const question = parseString(payload.body.question);
    if (!question) return badRequest('question must be a non-empty string.');
    data.question = question;
  }
  if (payload.body.answer !== undefined) {
    const answer = parseString(payload.body.answer);
    if (!answer) return badRequest('answer must be a non-empty string.');
    data.answer = answer;
  }
  if (payload.body.displayOrder !== undefined) {
    const displayOrder = parseInteger(payload.body.displayOrder);
    if (displayOrder === null)
      return badRequest('displayOrder must be an integer.');
    data.displayOrder = displayOrder;
  }
  if (payload.body.isPublished !== undefined) {
    const isPublished = parseBoolean(payload.body.isPublished);
    if (isPublished === null)
      return badRequest('isPublished must be a boolean.');
    data.isPublished = isPublished;
  }

  if (Object.keys(data).length === 0) {
    return badRequest('Provide at least one field to update.');
  }

  const [item] = await db()
    .update(faqItems)
    .set(data)
    .where(eq(faqItems.id, id))
    .returning();

  if (!item) return notFound();
  return ok({ item });
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
    .delete(faqItems)
    .where(eq(faqItems.id, id))
    .returning({ id: faqItems.id });

  if (!deleted) return notFound();
  return noContent();
}

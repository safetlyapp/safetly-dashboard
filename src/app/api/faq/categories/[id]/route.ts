import { and, eq, ne } from "drizzle-orm";
import { type NextRequest } from "next/server";
import { db } from "@/db";
import { faqCategories } from "@/db/schema";
import { requireAdmin } from "@/lib/api/admin-auth";
import {
  badRequest,
  conflict,
  noContent,
  notFound,
  ok,
  parseBoolean,
  parseInteger,
  parseString,
  readJsonObject,
} from "@/lib/api/request";

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  if (!isUuidLike(id)) return notFound();

  const [category] = await db()
    .select()
    .from(faqCategories)
    .where(eq(faqCategories.id, id))
    .limit(1);

  if (!category) return notFound();
  return ok({ category });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  if (!isUuidLike(id)) return notFound();

  const payload = await readJsonObject(request);
  if ("response" in payload) return payload.response;

  const data: Record<string, unknown> = {};

  if (payload.body.title !== undefined) {
    const title = parseString(payload.body.title);
    if (!title) return badRequest("title must be a non-empty string.");
    data.title = title;
  }
  if (payload.body.displayOrder !== undefined) {
    const displayOrder = parseInteger(payload.body.displayOrder);
    if (displayOrder === null) return badRequest("displayOrder must be an integer.");
    data.displayOrder = displayOrder;
  }
  if (payload.body.isPublished !== undefined) {
    const isPublished = parseBoolean(payload.body.isPublished);
    if (isPublished === null) return badRequest("isPublished must be a boolean.");
    data.isPublished = isPublished;
  }

  if (Object.keys(data).length === 0) {
    return badRequest("Provide at least one field to update.");
  }

  if (data.title) {
    const [existing] = await db()
      .select({ id: faqCategories.id })
      .from(faqCategories)
      .where(and(eq(faqCategories.title, data.title as string), ne(faqCategories.id, id)))
      .limit(1);
    if (existing) return conflict("A FAQ category with this title already exists.");
  }

  const [category] = await db()
    .update(faqCategories)
    .set(data)
    .where(eq(faqCategories.id, id))
    .returning();

  if (!category) return notFound();
  return ok({ category });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  if (!isUuidLike(id)) return notFound();

  const [deleted] = await db()
    .delete(faqCategories)
    .where(eq(faqCategories.id, id))
    .returning({ id: faqCategories.id });

  if (!deleted) return notFound();
  return noContent();
}

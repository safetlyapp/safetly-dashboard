import { and, asc, eq } from "drizzle-orm";
import { type NextRequest } from "next/server";
import { db } from "@/db";
import { faqCategories, faqItems } from "@/db/schema";
import { requireAdmin } from "@/lib/api/admin-auth";
import {
  badRequest,
  created,
  notFound,
  ok,
  parseBoolean,
  parseInteger,
  parseString,
  readJsonObject,
} from "@/lib/api/request";

export async function GET(request: NextRequest) {
  const categoryId = request.nextUrl.searchParams.get("categoryId");
  const query = db().select().from(faqItems);

  const rows = categoryId
    ? await query
        .where(and(eq(faqItems.isPublished, true), eq(faqItems.categoryId, categoryId)))
        .orderBy(asc(faqItems.displayOrder))
    : await query
        .where(eq(faqItems.isPublished, true))
        .orderBy(asc(faqItems.displayOrder));

  return ok({ items: rows });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  const payload = await readJsonObject(request);
  if ("response" in payload) return payload.response;

  const categoryId = parseString(payload.body.categoryId);
  const question = parseString(payload.body.question);
  const answer = parseString(payload.body.answer);
  const displayOrder = parseInteger(payload.body.displayOrder);
  const isPublished = parseBoolean(payload.body.isPublished);

  if (!categoryId || !question || !answer || displayOrder === null || isPublished === null) {
    return badRequest("categoryId, question, answer, displayOrder, and isPublished are required.");
  }

  const [category] = await db()
    .select({ id: faqCategories.id })
    .from(faqCategories)
    .where(eq(faqCategories.id, categoryId))
    .limit(1);
  if (!category) return notFound("FAQ category not found.");

  const [item] = await db()
    .insert(faqItems)
    .values({ categoryId, question, answer, displayOrder, isPublished })
    .returning();

  return created({ item });
}

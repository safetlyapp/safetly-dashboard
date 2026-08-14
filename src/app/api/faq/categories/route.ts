import { asc, eq, ne } from "drizzle-orm";
import { type NextRequest } from "next/server";
import { db } from "@/db";
import { faqCategories } from "@/db/schema";
import { requireAdmin } from "@/lib/api/admin-auth";
import {
  badRequest,
  conflict,
  created,
  ok,
  parseBoolean,
  parseInteger,
  parseString,
  readJsonObject,
} from "@/lib/api/request";

export async function GET() {
  const rows = await db()
    .select()
    .from(faqCategories)
    .where(eq(faqCategories.isPublished, true))
    .orderBy(asc(faqCategories.displayOrder), asc(faqCategories.title));

  return ok({ categories: rows });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  const payload = await readJsonObject(request);
  if ("response" in payload) return payload.response;

  const title = parseString(payload.body.title);
  const displayOrder = parseInteger(payload.body.displayOrder);
  const isPublished = parseBoolean(payload.body.isPublished);

  if (!title || displayOrder === null || isPublished === null) {
    return badRequest("title, displayOrder, and isPublished are required.");
  }

  const [existing] = await db()
    .select({ id: faqCategories.id })
    .from(faqCategories)
    .where(eq(faqCategories.title, title))
    .limit(1);
  if (existing) return conflict("A FAQ category with this title already exists.");

  const [category] = await db()
    .insert(faqCategories)
    .values({ title, displayOrder, isPublished })
    .returning();

  return created({ category });
}

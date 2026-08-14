import { and, asc, eq } from "drizzle-orm";
import { type NextRequest } from "next/server";
import { db } from "@/db";
import { reviews, reviewStatusEnum } from "@/db/schema";
import { requireAdmin } from "@/lib/api/admin-auth";
import {
  badRequest,
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
    .from(reviews)
    .where(and(eq(reviews.status, "approved"), eq(reviews.isFeatured, true)))
    .orderBy(asc(reviews.displayOrder), asc(reviews.reviewDate));

  return ok({ reviews: rows });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  const payload = await readJsonObject(request);
  if ("response" in payload) return payload.response;

  const name = parseString(payload.body.name);
  const quote = parseString(payload.body.quote);
  const rating = parseInteger(payload.body.rating);
  const reviewDateRaw = parseString(payload.body.reviewDate);
  const initials = parseString(payload.body.initials);
  const status = parseString(payload.body.status);
  const isFeatured = parseBoolean(payload.body.isFeatured);
  const displayOrder = parseInteger(payload.body.displayOrder);

  if (
    !name ||
    !quote ||
    rating === null ||
    !reviewDateRaw ||
    !initials ||
    !status ||
    isFeatured === null ||
    displayOrder === null
  ) {
    return badRequest("All review fields are required and valid.");
  }

  if (!["pending", "approved", "rejected"].includes(status)) {
    return badRequest("status must be pending, approved, or rejected.");
  }

  if (rating < 1 || rating > 5) {
    return badRequest("rating must be between 1 and 5.");
  }

  const reviewDate = new Date(reviewDateRaw);
  if (Number.isNaN(reviewDate.getTime())) {
    return badRequest("reviewDate must be a valid date string.");
  }

  const [review] = await db()
    .insert(reviews)
    .values({
      name,
      quote,
      rating,
      reviewDate,
      initials,
      status: status as (typeof reviewStatusEnum.enumValues)[number],
      isFeatured,
      displayOrder,
    })
    .returning();

  return created({ review });
}

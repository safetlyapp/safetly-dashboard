import { asc, eq, ne } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pricingPlans } from "@/db/schema";
import { requireAdmin } from "@/lib/api/admin-auth";
import {
  badRequest,
  conflict,
  created,
  ok,
  parseBoolean,
  parseHexColor,
  parseInteger,
  parseOptionalString,
  parseString,
  parseStringArray,
  readJsonObject,
} from "@/lib/api/request";

export async function GET() {
  const plans = await db()
    .select()
    .from(pricingPlans)
    .where(eq(pricingPlans.isActive, true))
    .orderBy(asc(pricingPlans.displayOrder), asc(pricingPlans.name));

  return ok({ plans });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  const payload = await readJsonObject(request);
  if ("response" in payload) return payload.response;

  const planId = parseString(payload.body.planId);
  const name = parseString(payload.body.name);
  const price = parseString(payload.body.price);
  const per = parseString(payload.body.per);
  const billedNote = parseString(payload.body.billedNote);
  const strikeNote = parseOptionalString(payload.body.strikeNote);
  const cta = parseString(payload.body.cta);
  const accentColor = parseHexColor(payload.body.accentColor);
  const isPopular = parseBoolean(payload.body.isPopular);
  const isActive = parseBoolean(payload.body.isActive);
  const displayOrder = parseInteger(payload.body.displayOrder);
  const features = parseStringArray(payload.body.features);

  if (
    !planId ||
    !name ||
    !price ||
    !per ||
    !billedNote ||
    cta === null ||
    !accentColor ||
    isPopular === null ||
    isActive === null ||
    displayOrder === null ||
    !features
  ) {
    return badRequest("All pricing plan fields are required and valid.");
  }

  const [existing] = await db()
    .select({ id: pricingPlans.id })
    .from(pricingPlans)
    .where(eq(pricingPlans.planId, planId))
    .limit(1);
  if (existing) return conflict("A pricing plan with this planId already exists.");

  const [plan] = await db()
    .insert(pricingPlans)
    .values({
      planId,
      name,
      price,
      per,
      billedNote,
      strikeNote: strikeNote || null,
      cta,
      accentColor,
      isPopular,
      isActive,
      displayOrder,
      features,
    })
    .returning();

  return created({ plan });
}

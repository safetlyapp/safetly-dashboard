import { and, eq, ne } from "drizzle-orm";
import { type NextRequest } from "next/server";
import { db } from "@/db";
import { pricingPlans } from "@/db/schema";
import { requireAdmin } from "@/lib/api/admin-auth";
import {
  badRequest,
  conflict,
  noContent,
  notFound,
  ok,
  parseBoolean,
  parseHexColor,
  parseInteger,
  parseOptionalString,
  parseString,
  parseStringArray,
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

  const [plan] = await db()
    .select()
    .from(pricingPlans)
    .where(eq(pricingPlans.id, id))
    .limit(1);

  if (!plan) return notFound();
  return ok({ plan });
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

  if (payload.body.planId !== undefined) {
    if (!planId) return badRequest("planId must be a non-empty string.");
    data.planId = planId;
  }
  if (payload.body.name !== undefined) {
    if (!name) return badRequest("name must be a non-empty string.");
    data.name = name;
  }
  if (payload.body.price !== undefined) {
    if (!price) return badRequest("price must be a non-empty string.");
    data.price = price;
  }
  if (payload.body.per !== undefined) {
    if (!per) return badRequest("per must be a non-empty string.");
    data.per = per;
  }
  if (payload.body.billedNote !== undefined) {
    if (!billedNote) return badRequest("billedNote must be a non-empty string.");
    data.billedNote = billedNote;
  }
  if (payload.body.strikeNote !== undefined) {
    data.strikeNote = strikeNote;
  }
  if (payload.body.cta !== undefined) {
    if (!cta) return badRequest("cta must be a non-empty string.");
    data.cta = cta;
  }
  if (payload.body.accentColor !== undefined) {
    if (!accentColor) return badRequest("accentColor must be a hex color.");
    data.accentColor = accentColor;
  }
  if (payload.body.isPopular !== undefined) {
    if (isPopular === null) return badRequest("isPopular must be a boolean.");
    data.isPopular = isPopular;
  }
  if (payload.body.isActive !== undefined) {
    if (isActive === null) return badRequest("isActive must be a boolean.");
    data.isActive = isActive;
  }
  if (payload.body.displayOrder !== undefined) {
    if (displayOrder === null) return badRequest("displayOrder must be an integer.");
    data.displayOrder = displayOrder;
  }
  if (payload.body.features !== undefined) {
    if (!features) return badRequest("features must be a string array.");
    data.features = features;
  }

  if (Object.keys(data).length === 0) {
    return badRequest("Provide at least one field to update.");
  }

  if (data.planId) {
    const [existing] = await db()
      .select({ id: pricingPlans.id })
      .from(pricingPlans)
      .where(and(eq(pricingPlans.planId, data.planId as string), ne(pricingPlans.id, id)))
      .limit(1);
    if (existing) return conflict("A pricing plan with this planId already exists.");
  }

  const [plan] = await db()
    .update(pricingPlans)
    .set(data)
    .where(eq(pricingPlans.id, id))
    .returning();

  if (!plan) return notFound();
  return ok({ plan });
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
    .delete(pricingPlans)
    .where(eq(pricingPlans.id, id))
    .returning({ id: pricingPlans.id });

  if (!deleted) return notFound();
  return noContent();
}

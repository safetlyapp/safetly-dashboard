import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { admins } from "@/db/schema";
import {
  PASSWORD_TIMING_PLACEHOLDER_HASH,
  SESSION_COOKIE_NAME,
  sessionCookieBase,
} from "@/lib/auth/constants";
import { signSessionToken } from "@/lib/auth/jwt";
import { verifyPassword } from "@/lib/auth/password";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { email: rawEmail, password: rawPassword } = body as Record<
    string,
    unknown
  >;
  const email =
    typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  const password = typeof rawPassword === "string" ? rawPassword : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const [admin] = await db()
    .select()
    .from(admins)
    .where(eq(admins.email, email))
    .limit(1);

  const hashForCompare = admin?.passwordHash ?? PASSWORD_TIMING_PLACEHOLDER_HASH;
  const passwordOk = await verifyPassword(password, hashForCompare);

  if (!admin || !passwordOk) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const token = await signSessionToken({
    sub: admin.id,
    email: admin.email,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieBase());
  return response;
}

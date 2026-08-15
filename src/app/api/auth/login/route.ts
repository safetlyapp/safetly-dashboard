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

async function readLoginCredentials(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return null;
    }

    const { email: rawEmail, password: rawPassword } = body as Record<
      string,
      unknown
    >;
    return {
      email: typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "",
      password: typeof rawPassword === "string" ? rawPassword : "",
    };
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return null;
  }

  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");

  return {
    email: typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "",
    password: typeof rawPassword === "string" ? rawPassword : "",
  };
}

export async function POST(request: NextRequest) {
  const credentials = await readLoginCredentials(request);
  if (!credentials) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { email, password } = credentials;

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
    const acceptsHtml = request.headers.get("accept")?.includes("text/html");
    if (acceptsHtml) {
      return NextResponse.redirect(new URL("/login?error=1", request.url), 303);
    }

    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const token = await signSessionToken({
    sub: admin.id,
    email: admin.email,
  });

  const acceptsHtml = request.headers.get("accept")?.includes("text/html");
  if (acceptsHtml) {
    const response = NextResponse.redirect(new URL("/dashboard", request.url), 303);
    response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieBase());
    return response;
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieBase());
  return response;
}

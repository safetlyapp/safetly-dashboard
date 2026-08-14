import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { clearSessionCookie, SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { getSession } from "@/lib/auth/session";
import { verifySessionToken } from "@/lib/auth/jwt";

export type AuthenticatedAdmin = {
  id: string;
  email: string;
};

export async function requireAdmin(
  request: NextRequest,
): Promise<{ admin: AuthenticatedAdmin } | { response: NextResponse }> {
  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : null;

  const session = bearerToken
    ? await verifySessionToken(bearerToken)
    : await getSession();

  if (!session) {
    const response = NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 },
    );
    response.cookies.set(SESSION_COOKIE_NAME, "", clearSessionCookie());
    return { response };
  }

  const [admin] = await db()
    .select({
      id: admins.id,
      email: admins.email,
    })
    .from(admins)
    .where(eq(admins.id, session.sub))
    .limit(1);

  if (!admin) {
    const response = NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 },
    );
    response.cookies.set(SESSION_COOKIE_NAME, "", clearSessionCookie());
    return { response };
  }

  return { admin };
}

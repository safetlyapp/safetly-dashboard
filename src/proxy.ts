import { type NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookie,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/constants";
import { verifySessionToken } from "@/lib/auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const session = await verifySessionToken(token);
    if (!session) {
      const res = NextResponse.redirect(new URL("/login", request.url));
      res.cookies.set(SESSION_COOKIE_NAME, "", clearSessionCookie());
      return res;
    }
    return NextResponse.next();
  }

  if (pathname === "/login") {
    if (token) {
      const session = await verifySessionToken(token);
      if (session) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};

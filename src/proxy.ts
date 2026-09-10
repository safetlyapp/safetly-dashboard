import { type NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, SESSION_COOKIE_NAME } from '@/lib/auth/constants';
import { verifySessionToken } from '@/lib/auth/jwt';

const isProd = process.env.NODE_ENV === 'production';

function createNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function buildContentSecurityPolicy(nonce: string) {
  return [
    "default-src 'self'",
    isProd
      ? `script-src 'self' 'nonce-${nonce}'`
      : `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    ...(isProd ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}

function applySecurityHeaders(response: NextResponse, csp: string) {
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const nonce = createNonce();
  const csp = buildContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set('content-security-policy', csp);
  requestHeaders.set('x-nonce', nonce);

  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return applySecurityHeaders(
        NextResponse.redirect(new URL('/login', request.url)),
        csp
      );
    }
    const session = await verifySessionToken(token);
    if (!session) {
      const res = NextResponse.redirect(new URL('/login', request.url));
      res.cookies.set(SESSION_COOKIE_NAME, '', clearSessionCookie());
      return applySecurityHeaders(res, csp);
    }
    return applySecurityHeaders(
      NextResponse.next({ request: { headers: requestHeaders } }),
      csp
    );
  }

  if (pathname === '/login') {
    if (token) {
      const session = await verifySessionToken(token);
      if (session) {
        return applySecurityHeaders(
          NextResponse.redirect(new URL('/dashboard', request.url)),
          csp
        );
      }
    }
    return applySecurityHeaders(
      NextResponse.next({ request: { headers: requestHeaders } }),
      csp
    );
  }

  return applySecurityHeaders(
    NextResponse.next({ request: { headers: requestHeaders } }),
    csp
  );
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

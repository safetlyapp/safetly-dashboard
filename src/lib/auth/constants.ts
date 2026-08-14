/**
 * `__Host-` prefix in production: Path=/, no Domain, Secure — binds cookie to host.
 * Omitted in development so HTTP localhost sessions still work.
 */
export const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Host-admin_session"
    : "admin_session";

/** Bcrypt hash of `password!` — used when no admin row exists (timing mitigation). */
export const PASSWORD_TIMING_PLACEHOLDER_HASH =
  "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

const DEFAULT_SESSION_SECONDS = 8 * 60 * 60;

export function getSessionMaxAgeSeconds(): number {
  const raw = process.env.SESSION_MAX_AGE_SECONDS;
  if (!raw) return DEFAULT_SESSION_SECONDS;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 60 || n > 60 * 60 * 24 * 30) {
    return DEFAULT_SESSION_SECONDS;
  }
  return n;
}

export function sessionCookieBase() {
  const maxAge = getSessionMaxAgeSeconds();
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function clearSessionCookie() {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}

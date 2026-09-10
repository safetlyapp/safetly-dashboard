import * as jose from 'jose';
import { getSessionMaxAgeSeconds } from './constants';

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters');
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: {
  sub: string;
  email: string;
}): Promise<string> {
  const maxAge = getSessionMaxAgeSeconds();
  return await new jose.SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(getSecretKey());
}

export type SessionPayload = { sub: string; email: string };

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, getSecretKey(), {
      algorithms: ['HS256'],
    });
    const sub = payload.sub;
    const email = payload.email;
    if (typeof sub !== 'string' || typeof email !== 'string') {
      return null;
    }
    return { sub, email };
  } catch {
    return null;
  }
}

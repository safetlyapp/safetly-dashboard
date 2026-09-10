import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from './constants';
import { verifySessionToken, type SessionPayload } from './jwt';

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

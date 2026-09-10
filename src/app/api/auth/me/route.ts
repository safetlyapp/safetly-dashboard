import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { admins } from '@/db/schema';
import { clearSessionCookie, SESSION_COOKIE_NAME } from '@/lib/auth/constants';
import { getSession } from '@/lib/auth/session';
import { verifySessionToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  const bearerToken = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : null;

  const session = bearerToken
    ? await verifySessionToken(bearerToken)
    : await getSession();

  if (!session) {
    const response = NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
    response.cookies.set(SESSION_COOKIE_NAME, '', clearSessionCookie());
    return response;
  }

  const [admin] = await db()
    .select({
      id: admins.id,
      email: admins.email,
      createdAt: admins.createdAt,
    })
    .from(admins)
    .where(eq(admins.id, session.sub))
    .limit(1);

  if (!admin) {
    const response = NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
    response.cookies.set(SESSION_COOKIE_NAME, '', clearSessionCookie());
    return response;
  }

  return NextResponse.json({
    user: {
      id: admin.id,
      email: admin.email,
      createdAt: admin.createdAt.toISOString(),
    },
  });
}

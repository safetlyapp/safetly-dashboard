import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { admins } from '@/db/schema';
import { getSession } from '@/lib/auth/session';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400 }
    );
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400 }
    );
  }

  const {
    currentPassword: rawCurrentPassword,
    newPassword: rawNewPassword,
    confirmPassword: rawConfirmPassword,
  } = body as Record<string, unknown>;

  const currentPassword =
    typeof rawCurrentPassword === 'string' ? rawCurrentPassword : '';
  const newPassword = typeof rawNewPassword === 'string' ? rawNewPassword : '';
  const confirmPassword =
    typeof rawConfirmPassword === 'string' ? rawConfirmPassword : '';

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json(
      { error: 'All password fields are required.' },
      { status: 400 }
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: 'New password must be at least 8 characters.' },
      { status: 400 }
    );
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { error: 'New password and confirmation do not match.' },
      { status: 400 }
    );
  }

  const [admin] = await db()
    .select({ id: admins.id, passwordHash: admins.passwordHash })
    .from(admins)
    .where(and(eq(admins.id, session.sub), eq(admins.email, session.email)))
    .limit(1);

  if (!admin) {
    return NextResponse.json(
      { error: 'Administrator not found.' },
      { status: 404 }
    );
  }

  const currentPasswordValid = await verifyPassword(
    currentPassword,
    admin.passwordHash
  );
  if (!currentPasswordValid) {
    return NextResponse.json(
      { error: 'Current password is incorrect.' },
      { status: 401 }
    );
  }

  const newPasswordHash = await hashPassword(newPassword);
  await db()
    .update(admins)
    .set({ passwordHash: newPasswordHash })
    .where(eq(admins.id, admin.id));

  return NextResponse.json({ ok: true });
}

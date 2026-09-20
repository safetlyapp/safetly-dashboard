import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/admin-auth';
import { getExternalParentChildren } from '@/lib/parent-child-api';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  try {
    const parents = await getExternalParentChildren();
    if (!parents)
      return NextResponse.json(
        { error: 'Parent/Child API is not configured.' },
        { status: 503 }
      );
    return NextResponse.json({ parents });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to load Parent/Child data.',
      },
      { status: 502 }
    );
  }
}

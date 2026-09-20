import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/admin-auth';
import { getExternalParentChildren } from '@/lib/parent-child-api';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ identifier: string }> }
) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  try {
    const parents = await getExternalParentChildren();
    if (!parents)
      return NextResponse.json(
        { error: 'Parent/Child API is not configured.' },
        { status: 503 }
      );
    const { identifier } = await context.params;
    const value = decodeURIComponent(identifier).trim().toLowerCase();
    const parent = parents.find(
      (item) => item.id.toLowerCase() === value || item.email.toLowerCase() === value
    );
    if (parent) return NextResponse.json({ parent });

    for (const candidate of parents) {
      const child = candidate.children.find(
        (item) =>
          item.id.toLowerCase() === value ||
          item.username.toLowerCase() === value ||
          item.email.toLowerCase() === value
      );
      if (child) return NextResponse.json({ child, parent: candidate });
    }
    return NextResponse.json({ error: 'Parent or child not found.' }, { status: 404 });
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

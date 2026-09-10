import { eq } from 'drizzle-orm';
import { type NextRequest } from 'next/server';
import { db } from '@/db';
import { coupons } from '@/db/schema';
import { requireAdmin } from '@/lib/api/admin-auth';
import { noContent, notFound } from '@/lib/api/request';

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const { id } = await context.params;
  if (!isUuid(id)) return notFound();
  const [deleted] = await db()
    .delete(coupons)
    .where(eq(coupons.id, id))
    .returning({ id: coupons.id });
  if (!deleted) return notFound();
  return noContent();
}

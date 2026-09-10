import type { Metadata } from 'next';
import { asc, count, desc, eq, ilike, or } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { db } from '@/db';
import { admins, children, paymentRecords } from '@/db/schema';
import { getSession } from '@/lib/auth/session';
import { PaymentAnalytics } from '@/components/dashboard/payment-analytics';

export const metadata: Metadata = {
  title: 'Payments',
  description: 'Search and review all Safetly payment records.',
};

const PAGE_SIZE = 15;

type PaymentsPageProps = {
  searchParams?: Promise<{ q?: string; page?: string }>;
};

function money(value: string | null) {
  return value === null ? '—' : `৳${Number(value).toFixed(2)}`;
}

function pageUrl(page: number, query: string) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  params.set('page', String(page));
  return `/dashboard/payments?${params.toString()}`;
}

export default async function PaymentsPage({
  searchParams,
}: PaymentsPageProps) {
  const session = await getSession();
  if (!session) redirect('/login');

  const [admin] = await db()
    .select({ id: admins.id })
    .from(admins)
    .where(eq(admins.id, session.sub))
    .limit(1);
  if (!admin) redirect('/login');

  const params = (await searchParams) ?? {};
  const query = params.q?.trim() ?? '';
  const requestedPage = Number.parseInt(params.page ?? '1', 10);
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const filter = query
    ? or(
        ilike(paymentRecords.customerEmail, `%${query}%`),
        ilike(children.username, `%${query}%`)
      )
    : undefined;

  const [{ total }] = await db()
    .select({ total: count() })
    .from(paymentRecords)
    .leftJoin(children, eq(paymentRecords.customerEmail, children.email))
    .where(filter);
  const totalRows = Number(total);
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const rows = await db()
    .select({ payment: paymentRecords, username: children.username })
    .from(paymentRecords)
    .leftJoin(children, eq(paymentRecords.customerEmail, children.email))
    .where(filter)
    .orderBy(desc(paymentRecords.createdAt), asc(paymentRecords.orderId))
    .limit(PAGE_SIZE)
    .offset((currentPage - 1) * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PaymentAnalytics />
      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>All payments</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {totalRows} record{totalRows === 1 ? '' : 's'} found
            </p>
          </div>
          <form className="flex w-full gap-2 md:w-auto">
            <Input
              name="q"
              defaultValue={query}
              placeholder="Search email or username"
              className="w-full md:w-72"
            />
            <Button type="submit">Search</Button>
          </form>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Original</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Charged</TableHead>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No payments found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map(({ payment, username }) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <p className="font-medium">{username ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">
                          {payment.customerEmail}
                        </p>
                      </TableCell>
                      <TableCell>{payment.packageName ?? '—'}</TableCell>
                      <TableCell>
                        {money(
                          payment.originalAmount ?? payment.submittedAmount
                        )}
                      </TableCell>
                      <TableCell>{money(payment.discountAmount)}</TableCell>
                      <TableCell className="font-semibold">
                        {money(
                          payment.verifiedAmount ?? payment.submittedAmount
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {payment.trxId}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payment.status === 'approved'
                              ? 'success'
                              : 'outline'
                          }
                        >
                          {payment.status.replaceAll('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {payment.createdAt.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <a
                href={
                  currentPage > 1 ? pageUrl(currentPage - 1, query) : undefined
                }
                aria-disabled={currentPage <= 1}
                className={`inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium ${currentPage <= 1 ? 'pointer-events-none opacity-50' : 'hover:bg-muted'}`}
              >
                Previous
              </a>
              <a
                href={
                  currentPage < totalPages
                    ? pageUrl(currentPage + 1, query)
                    : undefined
                }
                aria-disabled={currentPage >= totalPages}
                className={`inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium ${currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-muted'}`}
              >
                Next
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

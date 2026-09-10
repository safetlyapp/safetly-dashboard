'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { readApiError } from '@/lib/api/client';

type Coupon = {
  id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: string;
  maxUsageTotal: number | null;
  usageCount: number;
  expiresAt: string | null;
  isActive: boolean;
};

export function CouponsAdmin({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const router = useRouter();
  const [coupons, setCoupons] = useState(initialCoupons);
  const [form, setForm] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    maxUsageTotal: '',
    expiresAt: '',
    isActive: true,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createCoupon(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        setError(await readApiError(response, 'Could not create coupon.'));
        return;
      }
      const data = (await response.json()) as { coupon: Coupon };
      setCoupons((current) => [data.coupon, ...current]);
      setForm({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        maxUsageTotal: '',
        expiresAt: '',
        isActive: true,
      });
    } catch {
      setError('Network error while creating coupon.');
    } finally {
      setPending(false);
    }
  }

  async function deleteCoupon(coupon: Coupon) {
    if (
      !window.confirm(
        `Delete coupon ${coupon.code}? Its usage records will also be removed.`
      )
    )
      return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/coupons/${coupon.id}`, {
        method: 'DELETE',
      });
      if (!response.ok && response.status !== 204) {
        setError(await readApiError(response, 'Could not delete coupon.'));
        return;
      }
      setCoupons((current) => current.filter((item) => item.id !== coupon.id));
      router.refresh();
    } catch {
      setError('Network error while deleting coupon.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create coupon</CardTitle>
          <CardDescription>
            Set a discount and optional usage limit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={createCoupon}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            <Field label="Code">
              <Input
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="WELCOME10"
              />
            </Field>
            <Field label="Discount type">
              <select
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={form.discountType}
                onChange={(e) =>
                  setForm({ ...form, discountType: e.target.value })
                }
              >
                <option value="percentage">Percentage</option>
                <option value="flat">Flat</option>
              </select>
            </Field>
            <Field label="Discount value">
              <Input
                required
                inputMode="decimal"
                value={form.discountValue}
                onChange={(e) =>
                  setForm({ ...form, discountValue: e.target.value })
                }
                placeholder="10"
              />
            </Field>
            <Field label="Maximum total uses">
              <Input
                type="number"
                min="1"
                value={form.maxUsageTotal}
                onChange={(e) =>
                  setForm({ ...form, maxUsageTotal: e.target.value })
                }
                placeholder="Unlimited"
              />
            </Field>
            <Field label="Expires at">
              <Input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) =>
                  setForm({ ...form, expiresAt: e.target.value })
                }
              />
            </Field>
            <div className="flex items-end">
              <Button disabled={pending} type="submit">
                {pending ? 'Saving…' : 'Create coupon'}
              </Button>
            </div>
          </form>
          {error ? (
            <p className="mt-4 text-sm text-destructive">{error}</p>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>All coupons</CardTitle>
          <CardDescription>
            Usage counts are updated when customers successfully apply coupons.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => {
                const expired =
                  coupon.expiresAt !== null &&
                  new Date(coupon.expiresAt) <= new Date();
                const exhausted =
                  coupon.maxUsageTotal !== null &&
                  coupon.usageCount >= coupon.maxUsageTotal;
                return (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-semibold">
                      {coupon.code}
                    </TableCell>
                    <TableCell>
                      {coupon.discountType === 'percentage'
                        ? `${coupon.discountValue}%`
                        : coupon.discountValue}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{coupon.usageCount}</span>
                      {coupon.maxUsageTotal === null
                        ? ' / ∞'
                        : ` / ${coupon.maxUsageTotal}`}
                      <div className="text-xs text-muted-foreground">
                        {coupon.maxUsageTotal === null
                          ? 'Unlimited remaining'
                          : `${Math.max(coupon.maxUsageTotal - coupon.usageCount, 0)} remaining`}
                      </div>
                    </TableCell>
                    <TableCell>
                      {coupon.expiresAt
                        ? new Date(coupon.expiresAt).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      {!coupon.isActive ? (
                        <Badge variant="outline">Inactive</Badge>
                      ) : expired ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : exhausted ? (
                        <Badge variant="warning">Limit reached</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={pending}
                        onClick={() => deleteCoupon(coupon)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
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

type Child = {
  id: string;
  name: string;
  username: string;
  email: string;
  parentName: string;
  parentEmail: string;
  totalPaid: number;
  canManageSubscription?: boolean;
  subscription: {
    packageName: string;
    amount: string;
    expiresAt: string;
    status: string;
  } | null;
};
type Plan = { planId: string; name: string; price: string };

type FormState = {
  childId: string;
  planId: string;
  packageName: string;
  amount: string;
  discountAmount: string;
  expiresAt: string;
};
const emptyForm = (childId = '', planId = '', plan?: Plan): FormState => {
  const months = durationMonths(planId);
  const total = plan ? priceAmount(plan.price) * months : 0;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + months * 30);
  return {
    childId,
    planId,
    packageName: plan?.name ?? '',
    amount: plan ? (Math.round(total * 100) / 100).toFixed(2) : '',
    discountAmount: '0',
    expiresAt: plan ? localDateTime(expiry) : '',
  };
};
function durationMonths(planId: string) {
  return planId === 'quarterly'
    ? 3
    : planId === 'half-yearly'
      ? 6
      : planId === 'yearly'
        ? 12
        : 1;
}
function priceAmount(price: string) {
  const value = Number(price.replace(/[^\d.]/g, ''));
  return Number.isFinite(value) ? value : 0;
}
function localDateTime(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function UsersAdmin({
  children,
  plans,
  revenue,
}: {
  children: Child[];
  plans: Plan[];
  revenue: number;
}) {
  const router = useRouter();
  const manageableChildren = children;
  const [form, setForm] = useState<FormState>(
    emptyForm(manageableChildren[0]?.email, plans[0]?.planId, plans[0])
  );
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedParents, setExpandedParents] = useState<
    Record<string, boolean>
  >({});
  const [parentPage, setParentPage] = useState(1);
  const parents = useMemo(() => {
    const grouped = new Map<
      string,
      { name: string; email: string; children: Child[] }
    >();
    for (const child of children) {
      const key = child.parentEmail;
      const current = grouped.get(key) ?? {
        name: child.parentName,
        email: child.parentEmail,
        children: [],
      };
      current.children.push(child);
      grouped.set(key, current);
    }
    return [...grouped.values()]
      .map((parent) => ({
        ...parent,
        children: [...parent.children].sort(
          (a, b) => b.totalPaid - a.totalPaid
        ),
      }))
      .sort(
        (a, b) =>
          b.children.reduce((total, child) => total + child.totalPaid, 0) -
          a.children.reduce((total, child) => total + child.totalPaid, 0)
      );
  }, [children]);
  const parentPageSize = 10;
  const parentPageCount = Math.max(
    1,
    Math.ceil(parents.length / parentPageSize)
  );
  const visibleParents = parents.slice(
    (parentPage - 1) * parentPageSize,
    parentPage * parentPageSize
  );
  const update = (field: keyof FormState, value: string) =>
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'planId') {
        const plan = plans.find((item) => item.planId === value);
        const months = durationMonths(value);
        const total = plan ? priceAmount(plan.price) * months : 0;
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + months * 30);
        next.packageName = plan?.name ?? '';
        next.amount = (Math.round(total * 100) / 100).toFixed(2);
        next.expiresAt = localDateTime(expiry);
      }
      return next;
    });

  async function addSubscription(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    const response = await fetch('/api/admin/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.error ?? 'Could not add subscription.');
      setSaving(false);
      return;
    }
    setSuccess('Subscription added and child expiry date updated.');
    setForm(emptyForm(manageableChildren[0]?.email, plans[0]?.planId, plans[0]));
    router.refresh();
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Parents"
          value={new Set(children.map((child) => child.parentEmail)).size}
        />
        <Stat label="Children" value={children.length} />
        <Stat label="Recorded revenue" value={`৳${revenue.toFixed(2)}`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manually add subscription</CardTitle>
          <CardDescription>
            Select a package. Amount and expiry date will be calculated
            automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={addSubscription} className="space-y-5">
            {error ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {success}
              </p>
            ) : null}
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Child" htmlFor="subscription-child">
                <select
                  id="subscription-child"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.childId}
                  onChange={(event) => update('childId', event.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select a child
                  </option>
                  {children.map((child) => (
                    <option
                      key={child.email}
                      value={child.email}
                    >
                      {child.username} — {child.email}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Package" htmlFor="subscription-plan">
                <select
                  id="subscription-plan"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.planId}
                  onChange={(event) => update('planId', event.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select a package
                  </option>
                  {plans.map((plan) => (
                    <option key={plan.planId} value={plan.planId}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="flex justify-end border-t pt-5">
              <Button
                type="submit"
                disabled={saving || children.length === 0}
              >
                {saving ? 'Saving subscription…' : 'Add subscription'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parent and child relationships</CardTitle>
          <CardDescription>
            Current subscription status for every child.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {parents.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              No parent-child relationships found.
            </p>
          ) : (
            <div className="space-y-3">
              {visibleParents.map((parent) => {
                const expanded = expandedParents[parent.email] ?? false;
                const totalPaid = parent.children.reduce(
                  (total, child) => total + child.totalPaid,
                  0
                );
                return (
                  <div
                    key={parent.email}
                    className="overflow-hidden rounded-xl border"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-muted/40"
                      onClick={() =>
                        setExpandedParents((current) => ({
                          ...current,
                          [parent.email]: !expanded,
                        }))
                      }
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {parent.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {parent.email} · {parent.children.length} child
                          {parent.children.length === 1 ? '' : 'ren'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-emerald-700">
                          Total paid: ৳{totalPaid.toFixed(2)}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </button>
                    {expanded ? (
                      <div className="space-y-2 border-t bg-slate-50/60 p-3">
                        {parent.children.map((child) => {
                          const active =
                            child.subscription?.status === 'active' &&
                            new Date(child.subscription.expiresAt) > new Date();
                          return (
                            <div
                              key={child.id || child.email}
                              className="grid gap-3 rounded-lg border bg-white p-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-center"
                            >
                              <div>
                                <p className="font-semibold">
                                  {child.name}{' '}
                                  <span className="font-normal text-muted-foreground">
                                    (@{child.username})
                                  </span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {child.email}
                                </p>
                              </div>
                              <div>
                                {child.subscription ? (
                                  <>
                                    <p className="font-medium">
                                      {child.subscription.packageName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      ৳{child.subscription.amount} · expires{' '}
                                      {new Date(
                                        child.subscription.expiresAt
                                      ).toLocaleDateString()}
                                    </p>
                                  </>
                                ) : (
                                  <span className="text-sm text-muted-foreground">
                                    No subscription
                                  </span>
                                )}
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Total paid
                                </p>
                                <p className="font-semibold">
                                  ৳{child.totalPaid.toFixed(2)}
                                </p>
                              </div>
                              <Badge variant={active ? 'success' : 'outline'}>
                                {active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Page {parentPage} of {parentPageCount}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={parentPage <= 1}
                onClick={() => setParentPage((page) => Math.max(1, page - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={parentPage >= parentPageCount}
                onClick={() =>
                  setParentPage((page) => Math.min(parentPageCount, page + 1))
                }
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

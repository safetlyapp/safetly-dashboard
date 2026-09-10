'use client';

import { useMemo, useState } from 'react';
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
import { Dialog } from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { readApiError } from '@/lib/api/client';

type PricingPlanRow = {
  id: string;
  planId: string;
  name: string;
  price: string;
  per: string;
  billedNote: string;
  strikeNote: string | null;
  cta: string;
  accentColor: string;
  isPopular: boolean;
  isActive: boolean;
  displayOrder: number;
  features: string[];
};

type PricingFormState = {
  planId: string;
  name: string;
  price: string;
  per: string;
  billedNote: string;
  strikeNote: string;
  cta: string;
  accentColor: string;
  isPopular: boolean;
  isActive: boolean;
  displayOrder: string;
  features: string;
};

const emptyForm: PricingFormState = {
  planId: '',
  name: '',
  price: '',
  per: '',
  billedNote: '',
  strikeNote: '',
  cta: '',
  accentColor: '#F16521',
  isPopular: false,
  isActive: true,
  displayOrder: '0',
  features: '',
};

function formFromPlan(plan: PricingPlanRow): PricingFormState {
  return {
    planId: plan.planId,
    name: plan.name,
    price: plan.price,
    per: plan.per,
    billedNote: plan.billedNote,
    strikeNote: plan.strikeNote ?? '',
    cta: plan.cta,
    accentColor: plan.accentColor,
    isPopular: plan.isPopular,
    isActive: plan.isActive,
    displayOrder: String(plan.displayOrder),
    features: plan.features.join('\n'),
  };
}

function lines(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function PricingAdmin({
  initialPlans,
}: {
  initialPlans: PricingPlanRow[];
}) {
  const router = useRouter();
  const [plans, setPlans] = useState(initialPlans);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PricingFormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<PricingPlanRow | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editingPlan = useMemo(
    () => plans.find((plan) => plan.id === editingId) ?? null,
    [editingId, plans]
  );

  function openCreate() {
    setMode('create');
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setOpen(true);
  }

  function openEdit(plan: PricingPlanRow) {
    setMode('edit');
    setEditingId(plan.id);
    setForm(formFromPlan(plan));
    setError(null);
    setOpen(true);
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const payload = {
      planId: form.planId.trim(),
      name: form.name.trim(),
      price: form.price.trim(),
      per: form.per.trim(),
      billedNote: form.billedNote.trim(),
      strikeNote: form.strikeNote.trim() || null,
      cta: form.cta.trim(),
      accentColor: form.accentColor.trim(),
      isPopular: form.isPopular,
      isActive: form.isActive,
      displayOrder: Number.parseInt(form.displayOrder, 10) || 0,
      features: lines(form.features),
    };

    try {
      const response = await fetch(
        mode === 'create' ? '/api/pricing' : `/api/pricing/${editingId}`,
        {
          method: mode === 'create' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        setError(await readApiError(response, 'Could not save pricing plan.'));
        return;
      }

      const data: unknown = await response.json();
      const plan =
        data && typeof data === 'object' && 'plan' in data
          ? (data as { plan?: PricingPlanRow }).plan
          : null;

      if (plan) {
        setPlans((current) =>
          mode === 'create'
            ? [...current, plan].sort((a, b) => a.displayOrder - b.displayOrder)
            : current.map((item) => (item.id === plan.id ? plan : item))
        );
      } else {
        router.refresh();
      }

      setOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch {
      setError('Network error while saving pricing plan.');
    } finally {
      setPending(false);
    }
  }

  async function deletePlan() {
    if (!deleteTarget) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/pricing/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (!response.ok && response.status !== 204) {
        setError(
          await readApiError(response, 'Could not delete pricing plan.')
        );
        return;
      }
      setPlans((current) =>
        current.filter((item) => item.id !== deleteTarget.id)
      );
      setDeleteTarget(null);
      router.refresh();
    } catch {
      setError('Network error while deleting pricing plan.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-orange-200/70 bg-gradient-to-br from-white via-orange-50/30 to-purple-50/40">
        <CardHeader className="border-b bg-white/70">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl">Pricing Plans</CardTitle>
              <CardDescription>
                Manage subscription plans shown on the public site.
              </CardDescription>
            </div>
            <Button
              onClick={openCreate}
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white"
            >
              New plan
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Pricing</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full border"
                          style={{ backgroundColor: plan.accentColor }}
                        />
                        <p className="font-medium">{plan.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-mono">{plan.planId}</span>
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-semibold">
                        {plan.price}{' '}
                        <span className="text-sm font-normal text-muted-foreground">
                          {plan.per}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {plan.billedNote}
                        {plan.strikeNote ? (
                          <span className="ml-1 line-through">
                            {plan.strikeNote}
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={plan.isPopular ? 'warning' : 'outline'}>
                        {plan.isPopular ? 'Popular' : 'Standard'}
                      </Badge>
                      <Badge variant={plan.isActive ? 'success' : 'secondary'}>
                        {plan.isActive ? 'Active' : 'Hidden'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {plan.features.slice(0, 2).map((feature) => (
                        <Badge key={feature} variant="outline">
                          {feature}
                        </Badge>
                      ))}
                      {plan.features.length > 2 ? (
                        <Badge variant="secondary">
                          +{plan.features.length - 2} more
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{plan.displayOrder}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(plan)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteTarget(plan)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={mode === 'create' ? 'Create pricing plan' : 'Edit pricing plan'}
        description={
          mode === 'create'
            ? 'Add a new plan to the pricing table.'
            : `Editing ${editingPlan?.name ?? 'pricing plan'}`
        }
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Prices and features update immediately after saving.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="pricing-form"
                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                disabled={pending}
              >
                {pending ? 'Saving...' : 'Save plan'}
              </Button>
            </div>
          </div>
        }
      >
        <form
          id="pricing-form"
          className="grid gap-4 md:grid-cols-2"
          onSubmit={submitForm}
        >
          {error ? (
            <p className="md:col-span-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="planId">Plan ID</Label>
            <Input
              id="planId"
              value={form.planId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  planId: event.target.value,
                }))
              }
              placeholder="monthly"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Monthly/30-Day"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              value={form.price}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  price: event.target.value,
                }))
              }
              placeholder="৳99"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="per">Per</Label>
            <Input
              id="per"
              value={form.per}
              onChange={(event) =>
                setForm((current) => ({ ...current, per: event.target.value }))
              }
              placeholder="/mo."
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="billedNote">Billed note</Label>
            <Input
              id="billedNote"
              value={form.billedNote}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  billedNote: event.target.value,
                }))
              }
              placeholder="*Billed monthly at ৳99"
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="strikeNote">Strike note</Label>
            <Input
              id="strikeNote"
              value={form.strikeNote}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  strikeNote: event.target.value,
                }))
              }
              placeholder="৳297"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="cta">CTA label</Label>
            <Input
              id="cta"
              value={form.cta}
              onChange={(event) =>
                setForm((current) => ({ ...current, cta: event.target.value }))
              }
              placeholder="Subscribe for 30 days"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accentColor">Accent color</Label>
            <div className="flex gap-2">
              <Input
                id="accentColor"
                value={form.accentColor}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    accentColor: event.target.value,
                  }))
                }
                placeholder="#F16521"
                required
              />
              <span
                className="h-8 w-8 rounded-lg border"
                style={{ backgroundColor: form.accentColor }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayOrder">Display order</Label>
            <Input
              id="displayOrder"
              type="number"
              value={form.displayOrder}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  displayOrder: event.target.value,
                }))
              }
            />
          </div>
          <div className="md:col-span-2 grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-xl border px-3 py-2">
              <input
                type="checkbox"
                checked={form.isPopular}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isPopular: event.target.checked,
                  }))
                }
                className="h-4 w-4 accent-orange-500"
              />
              <span className="text-sm">Mark as popular</span>
            </label>
            <label className="flex items-center gap-2 rounded-xl border px-3 py-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
                className="h-4 w-4 accent-emerald-500"
              />
              <span className="text-sm">Active / visible</span>
            </label>
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="features">Features</Label>
            <Textarea
              id="features"
              value={form.features}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  features: event.target.value,
                }))
              }
              placeholder={'1-month access\nNo auto-renew\nOne device tracking'}
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              Enter one feature per line.
            </p>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(value) => !value && setDeleteTarget(null)}
        title="Delete pricing plan"
        description={
          deleteTarget
            ? `This will permanently remove ${deleteTarget.name}.`
            : undefined
        }
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deletePlan}
              disabled={pending}
            >
              {pending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          Deleted plans are removed from the homepage and cannot be recovered.
        </p>
      </Dialog>
    </div>
  );
}

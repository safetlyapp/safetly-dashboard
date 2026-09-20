'use client';

import { FormEvent, useState } from 'react';
import { CheckCircle2, KeyRound, Receipt, ShieldCheck, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { readApiError } from '@/lib/api/client';

type AdminDashboardProps = {
  id: string;
  email: string;
  createdAt: string;
  stats: {
    parents: number;
    children: number;
    premium: number;
    trial: number;
    payments: number;
    approvedPayments: number;
  };
};

export function AdminDashboard({ id, email, createdAt, stats }: AdminDashboardProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (newPassword.length < 8) {
      setMessage({
        type: 'error',
        text: 'New password must be at least 8 characters.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'New password and confirmation do not match.',
      });
      return;
    }

    setPending(true);
    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      if (!response.ok) {
        setMessage({
          type: 'error',
          text: await readApiError(
            response,
            'Could not update password. Please try again.'
          ),
        });
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Password updated successfully.' });
    } catch {
      setMessage({
        type: 'error',
        text: 'Network error while updating password.',
      });
    } finally {
      setPending(false);
    }
  }

  const createdAtLabel = new Date(createdAt).toLocaleString();

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6">
      <section>
        <div className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">A quick view of users, subscriptions, and payments.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <OverviewCard label="Parents" value={stats.parents} icon={<Users className="size-4" />} />
          <OverviewCard label="Children" value={stats.children} icon={<User className="size-4" />} />
          <OverviewCard label="Premium active" value={stats.premium} icon={<ShieldCheck className="size-4" />} tone="green" />
          <OverviewCard label="Trial / inactive" value={stats.trial} icon={<CheckCircle2 className="size-4" />} tone="orange" />
          <OverviewCard label="Payments" value={stats.payments} icon={<Receipt className="size-4" />} />
          <OverviewCard label="Approved payments" value={stats.approvedPayments} icon={<CheckCircle2 className="size-4" />} tone="green" />
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-5 md:gap-6">
      <section className="md:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-4" />
              User Profile
            </CardTitle>
            <CardDescription>
              Your administrator details and account status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">User ID</p>
              <p className="mt-1 break-all text-sm font-medium text-foreground">
                {id}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">Signed in email</p>
              <p className="mt-1 break-all text-sm font-medium text-foreground">
                {email}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">Account created</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {createdAtLabel}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                System Administrator
              </p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                Active session
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="md:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="size-4" />
              Security Controls
            </CardTitle>
            <CardDescription>
              Update your password to keep administrator access secure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handlePasswordChange}>
              <div className="space-y-2">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </div>
              {message ? (
                <p
                  className={`text-sm ${
                    message.type === 'success'
                      ? 'text-foreground'
                      : 'text-destructive'
                  }`}
                  role="status"
                >
                  {message.text}
                </p>
              ) : null}
              <CardFooter className="justify-end gap-2 border-t-0 bg-transparent p-0 pt-2">
                <Button type="submit" disabled={pending}>
                  {pending ? 'Updating...' : 'Change password'}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </section>
      </div>
    </main>
  );
}

function OverviewCard({ label, value, icon, tone = 'default' }: { label: string; value: number; icon: React.ReactNode; tone?: 'default' | 'green' | 'orange' }) {
  const colors = tone === 'green' ? 'bg-emerald-100 text-emerald-700' : tone === 'orange' ? 'bg-orange-100 text-orange-700' : 'bg-muted text-foreground';
  return <Card><CardContent className="flex items-center gap-3 p-4"><div className={`rounded-lg p-2 ${colors}`}>{icon}</div><div><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-semibold">{value}</p></div></CardContent></Card>;
}

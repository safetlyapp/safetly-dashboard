'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type Day = {
  day: number;
  total: number;
  approved: number;
  failed: number;
  amount: number;
  revenue: number;
};
type Analytics = {
  month: string;
  days: Day[];
  summary: {
    total: number;
    approved: number;
    failed: number;
    totalAmount: number;
    revenue: number;
  };
};

export function PaymentAnalytics() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/payments/analytics?month=${month}`, { cache: 'no-store' })
      .then((response) => response.json() as Promise<Analytics>)
      .then(setData)
      .finally(() => setLoading(false));
  }, [month]);

  const maxCount = useMemo(
    () =>
      Math.max(
        1,
        ...(data?.days.map((day) => Math.max(day.approved, day.failed)) ?? [1])
      ),
    [data]
  );
  return (
    <Card>
      <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Payment analytics</CardTitle>
          <CardDescription>
            Daily approved and failed payment activity.
          </CardDescription>
        </div>
        <input
          aria-label="Select payment month"
          type="month"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        />
      </CardHeader>
      <CardContent>
        {loading || !data ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading analytics…
          </p>
        ) : (
          <>
            <div className="mb-5 grid gap-3 sm:grid-cols-4">
              <Metric label="Total payments" value={data.summary.total} />
              <Metric
                label="Approved amount"
                value={`৳${data.summary.totalAmount.toFixed(2)}`}
                tone="purple"
              />
              <Metric
                label="Approved"
                value={data.summary.approved}
                tone="green"
              />
              <Metric label="Failed" value={data.summary.failed} tone="red" />
            </div>
            <div className="overflow-x-auto">
              <div
                className="flex min-w-[720px] items-end gap-1 border-b border-l px-2 pb-2 pt-4"
                style={{ height: 250 }}
              >
                {data.days.map((day) => (
                  <div
                    key={day.day}
                    className="flex h-full flex-1 items-end justify-center gap-0.5"
                    title={`Day ${day.day}: ${day.approved} approved, ${day.failed} failed`}
                  >
                    <div
                      className="w-1/2 rounded-t bg-emerald-500"
                      style={{
                        height: `${(day.approved / maxCount) * 100}%`,
                        minHeight: day.approved ? 3 : 0,
                      }}
                    />
                    <div
                      className="w-1/2 rounded-t bg-red-400"
                      style={{
                        height: `${(day.failed / maxCount) * 100}%`,
                        minHeight: day.failed ? 3 : 0,
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex min-w-[720px] justify-between px-2 pt-2 text-[10px] text-muted-foreground">
                <span>1</span>
                <span>5</span>
                <span>10</span>
                <span>15</span>
                <span>20</span>
                <span>25</span>
                <span>{data.days.length}</span>
              </div>
            </div>
            <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
              <span>
                <i className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                Approved
              </span>
              <span>
                <i className="mr-1 inline-block h-2 w-2 rounded-full bg-red-400" />
                Failed / other
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  tone = 'slate',
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${tone === 'green' ? 'border-emerald-200 bg-emerald-50' : tone === 'red' ? 'border-red-200 bg-red-50' : tone === 'purple' ? 'border-purple-200 bg-purple-50' : 'bg-muted/30'}`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

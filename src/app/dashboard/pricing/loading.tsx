import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function Loading() {
  return (
    <DashboardShell>
      <div className="space-y-6 p-4 md:p-6">
        <div className="h-5 w-32 rounded-full bg-slate-100" />
        <div className="h-4 w-80 max-w-full rounded-full bg-slate-100" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="h-4 w-24 rounded-full bg-slate-100" />
              <div className="mt-4 h-8 w-20 rounded-full bg-slate-100" />
              <div className="mt-5 space-y-2">
                <div className="h-3 rounded-full bg-slate-100" />
                <div className="h-3 rounded-full bg-slate-100" />
                <div className="h-3 w-4/5 rounded-full bg-slate-100" />
              </div>
              <div className="mt-6 h-10 rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

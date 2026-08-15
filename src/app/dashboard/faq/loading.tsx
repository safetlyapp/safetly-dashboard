
export default function Loading() {
  return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="h-5 w-28 rounded-full bg-slate-100" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[280px_1fr]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-4 w-28 rounded-full bg-slate-100" />
            <div className="mt-4 space-y-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-10 rounded-xl bg-slate-100" />
              ))}
            </div>
          </aside>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-4 w-40 rounded-full bg-slate-100" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="h-4 w-3/4 rounded-full bg-slate-100" />
                  <div className="mt-3 h-3 w-2/3 rounded-full bg-slate-100" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
  );
}

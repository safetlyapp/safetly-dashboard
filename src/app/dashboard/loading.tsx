
export default function Loading() {
  return (
      <main className="grid flex-1 gap-4 p-4 md:grid-cols-5 md:gap-6 md:p-6">
        <section className="md:col-span-2">
          <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-5 w-32 rounded-full bg-slate-100" />
            <div className="mt-4 space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="h-3 w-20 rounded-full bg-slate-100" />
                  <div className="mt-2 h-4 w-3/4 rounded-full bg-slate-100" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="md:col-span-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-5 w-40 rounded-full bg-slate-100" />
            <div className="mt-4 space-y-4">
              <div className="h-11 rounded-xl bg-slate-100" />
              <div className="h-11 rounded-xl bg-slate-100" />
              <div className="h-11 rounded-xl bg-slate-100" />
              <div className="h-24 rounded-2xl bg-slate-100" />
              <div className="h-10 w-36 rounded-xl bg-slate-200" />
            </div>
          </div>
        </section>
      </main>
  );
}

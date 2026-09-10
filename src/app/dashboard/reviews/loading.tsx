export default function Loading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="h-5 w-32 rounded-full bg-slate-100" />
      <div className="h-4 w-96 max-w-full rounded-full bg-slate-100" />
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b bg-slate-50 px-6 py-4">
          <div className="grid grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-4 rounded-full bg-slate-100" />
            ))}
          </div>
        </div>
        <div className="space-y-0">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-6 gap-4 border-b px-6 py-4 last:border-b-0"
            >
              <div className="h-4 rounded-full bg-slate-100" />
              <div className="h-4 rounded-full bg-slate-100" />
              <div className="h-4 rounded-full bg-slate-100" />
              <div className="h-4 rounded-full bg-slate-100" />
              <div className="h-4 rounded-full bg-slate-100" />
              <div className="h-4 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

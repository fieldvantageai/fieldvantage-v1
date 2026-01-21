export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-40 animate-pulse rounded-lg bg-slate-200" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl bg-slate-200"
          />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-14 animate-pulse rounded-xl bg-slate-200"
          />
        ))}
      </div>
    </div>
  );
}

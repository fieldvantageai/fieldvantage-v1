export default function CustomersLoading() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-48 animate-pulse rounded-lg bg-slate-200" />
      <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-14 animate-pulse rounded-xl bg-slate-200"
          />
        ))}
      </div>
    </div>
  );
}

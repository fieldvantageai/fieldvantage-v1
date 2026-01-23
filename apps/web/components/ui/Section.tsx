type SectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function Section({ title, description, children }: SectionProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm sm:p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">{title}</h2>
        {description ? (
          <p className="text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

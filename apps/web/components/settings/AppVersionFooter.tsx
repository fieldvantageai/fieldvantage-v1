"use client";

const ENV_LABELS: Record<string, string> = {
  production: "Production",
  development: "Development",
  test: "Test",
};

function formatBuildDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function AppVersionFooter() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "—";
  const buildDate = process.env.NEXT_PUBLIC_BUILD_DATE
    ? formatBuildDate(process.env.NEXT_PUBLIC_BUILD_DATE)
    : "—";
  const env = process.env.NEXT_PUBLIC_APP_ENV ?? "development";
  const envLabel = ENV_LABELS[env] ?? env;

  return (
    <div className="mt-10 border-t border-slate-100 pt-6 pb-2">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-slate-500">
          FieldVantage{" "}
          <span className="font-normal text-slate-400">v{version}</span>
        </p>
        <p className="text-xs text-slate-400">
          Build: {buildDate} · {envLabel}
        </p>
      </div>
    </div>
  );
}

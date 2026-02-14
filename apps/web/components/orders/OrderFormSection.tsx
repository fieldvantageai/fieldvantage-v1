"use client";

import type { ReactNode } from "react";

import StatusBadge from "@/components/orders/StatusBadge";
import type { JobStatus } from "@fieldvantage/shared";

type FormSectionProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
};

export function FormSection({
  icon,
  title,
  subtitle,
  children,
  className,
  action
}: FormSectionProps) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/70 bg-card p-6 transition-all duration-200 ${
        className ?? ""
      }`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-slate-400">{icon}</span>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

type StatusCardFieldProps = {
  label: string;
  status: JobStatus;
  select: ReactNode;
  error?: string;
  actionLabel: string;
};

const statusDotStyles: Record<JobStatus, string> = {
  scheduled: "bg-blue-500",
  in_progress: "bg-amber-500",
  done: "bg-emerald-500",
  canceled: "bg-rose-500"
};

export function StatusCardField({
  label,
  status,
  select,
  error,
  actionLabel
}: StatusCardFieldProps) {
  const dotClass = statusDotStyles[status] ?? "bg-slate-400";
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-card p-4 transition-all duration-200">
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <div className="mt-3 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
        <StatusBadge status={status} />
      </div>
      <div className="mt-3 space-y-2">
        <span className="text-xs font-semibold text-slate-600">{actionLabel}</span>
        <div className="min-w-[180px]">{select}</div>
      </div>
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

type DateFieldProps = {
  label: string;
  icon: ReactNode;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function DateField({ label, icon, error, className, ...props }: DateFieldProps) {
  return (
    <div className="space-y-1.5 transition-all duration-200">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
        <input
          {...props}
          className={`h-11 w-full rounded-xl border bg-white/90 pl-9 pr-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 ${
            error ? "border-rose-400 focus:border-rose-400" : "border-slate-200/70"
          } ${className ?? ""}`}
          aria-invalid={Boolean(error)}
        />
      </div>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

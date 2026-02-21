import * as React from "react";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "success" | "warning" | "danger";
};

export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  const styles: Record<NonNullable<BadgeProps["variant"]>, string> = {
    default: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300",
    success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
    warning: "bg-amber-50 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
    danger:  "bg-rose-50 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300"
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${styles[variant]} ${className ?? ""}`}
      {...props}
    />
  );
}

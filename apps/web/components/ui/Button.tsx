import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";

  const styles = {
    primary:
      "bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800 focus-visible:ring-2 focus-visible:ring-brand-400",
    secondary:
      "bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-slate-300 dark:bg-[var(--surface)] dark:text-[var(--text)] dark:border dark:border-[var(--border)] dark:hover:bg-[var(--surface2)]",
    ghost:
      "text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-200 dark:text-[var(--text-muted)] dark:hover:bg-[var(--surface)] dark:hover:text-[var(--text)]"
  };

  return (
    <button
      className={`${base} ${styles[variant]} ${className ?? ""}`}
      {...props}
    />
  );
}

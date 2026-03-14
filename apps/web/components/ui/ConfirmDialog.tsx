"use client";

import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

type ConfirmDialogVariant = "danger" | "warning" | "info";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  variant?: ConfirmDialogVariant;
  icon?: ReactNode;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const variantStyles: Record<
  ConfirmDialogVariant,
  { iconBg: string; iconText: string; btnBg: string; btnHover: string }
> = {
  danger: {
    iconBg: "bg-red-100",
    iconText: "text-red-600",
    btnBg: "bg-red-600",
    btnHover: "hover:bg-red-700",
  },
  warning: {
    iconBg: "bg-amber-100",
    iconText: "text-amber-600",
    btnBg: "bg-amber-500",
    btnHover: "hover:bg-amber-600",
  },
  info: {
    iconBg: "bg-brand-100",
    iconText: "text-brand-600",
    btnBg: "bg-brand-600",
    btnHover: "hover:bg-brand-700",
  },
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "warning",
  icon,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const style = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl dark:bg-[var(--surface)]">
        <div className="mb-4 flex items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.iconBg} ${style.iconText}`}
          >
            {icon ?? <AlertTriangle className="h-5 w-5" />}
          </span>
          <div>
            <p className="font-semibold text-slate-900 dark:text-[var(--text)]">
              {title}
            </p>
            {description ? (
              <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${style.btnBg} ${style.btnHover} disabled:opacity-60`}
          >
            {isLoading ? (
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            ) : null}
            {confirmLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-[var(--border)] dark:text-[var(--text)]"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

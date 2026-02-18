import type { ReactNode } from "react";

import { Button } from "./Button";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionClassName?: string;
  illustration?: ReactNode;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  actionClassName,
  illustration
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200/70 bg-white/90 p-8 text-center shadow-sm">
      {illustration ? <div className="mb-3 flex justify-center">{illustration}</div> : null}
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      ) : null}
      {actionLabel ? (
        <div className="mt-4">
          <Button
            variant="secondary"
            onClick={onAction}
            className={actionClassName}
          >
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

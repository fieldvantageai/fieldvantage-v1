"use client";

import { Badge } from "@/components/ui/Badge";
import type { JobStatus } from "@fieldvantage/shared";
import { useClientT } from "@/lib/i18n/useClientT";

type StatusBadgeProps = {
  status: JobStatus;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useClientT("jobs");
  const label = t(`status.${status}`);
  const variant =
    status === "done"
      ? "success"
      : status === "in_progress"
        ? "warning"
        : status === "canceled"
          ? "danger"
          : "default";
  const scheduledClass =
    status === "scheduled" ? "bg-blue-50 text-blue-700" : "";

  return (
    <Badge variant={variant} className={scheduledClass}>
      {label}
    </Badge>
  );
}

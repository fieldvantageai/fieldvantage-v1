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

  return <Badge variant={variant}>{label}</Badge>;
}

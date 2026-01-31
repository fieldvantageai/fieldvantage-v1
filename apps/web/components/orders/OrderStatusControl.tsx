"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/Badge";
import StatusUpdateDialog from "@/components/orders/StatusUpdateDialog";
import { useClientT } from "@/lib/i18n/useClientT";
import type { Job, JobStatus } from "@fieldvantage/shared";

type OrderStatusControlProps = {
  orderId: string;
  status: Job["status"];
};

const toDateTimeLocalValue = (date: Date) => {
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const statusVariant = (status: JobStatus) =>
  status === "done"
    ? "success"
    : status === "in_progress"
      ? "warning"
      : status === "canceled"
        ? "danger"
        : "default";

export default function OrderStatusControl({ orderId, status }: OrderStatusControlProps) {
  const { t } = useClientT("jobs");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<JobStatus>(status);
  const [changedAt, setChangedAt] = useState(toDateTimeLocalValue(new Date()));
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (
    nextStatus: JobStatus,
    nextChangedAt: string,
    nextNote: string
  ) => {
    if (!nextChangedAt || isSaving) {
      return;
    }
    setIsSaving(true);
    const response = await fetch(`/api/jobs/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: nextStatus,
        changedAt: new Date(nextChangedAt).toISOString(),
        note: nextNote?.trim() || null
      })
    });

    if (response.ok) {
      setCurrentStatus(nextStatus);
      setNote("");
      setOpen(false);
      router.refresh();
    }
    setIsSaving(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setChangedAt(toDateTimeLocalValue(new Date()));
          setNote("");
          setOpen(true);
        }}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white px-2 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
        aria-label={t("detail.history.updateStatus")}
      >
        <Badge variant={statusVariant(currentStatus)}>
          {t(`status.${currentStatus}`)}
        </Badge>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <StatusUpdateDialog
        open={open}
        status={currentStatus}
        changedAt={changedAt}
        note={note}
        onCancel={() => setOpen(false)}
        onSave={handleSave}
      />
    </>
  );
}

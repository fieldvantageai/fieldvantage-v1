"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useClientT } from "@/lib/i18n/useClientT";
import type { Job } from "@fieldvantage/shared";

type StatusUpdateDialogProps = {
  open: boolean;
  status: Job["status"];
  changedAt: string;
  onCancel: () => void;
  onSave: (status: Job["status"], changedAt: string) => void;
};

const toDateTimeLocalValue = (value?: string | null) => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function StatusUpdateDialog({
  open,
  status,
  changedAt,
  onCancel,
  onSave
}: StatusUpdateDialogProps) {
  const { t } = useClientT("jobs");
  const { t: tCommon } = useClientT("common");
  const [draftStatus, setDraftStatus] = useState<Job["status"]>(status);
  const [draftChangedAt, setDraftChangedAt] = useState(
    toDateTimeLocalValue(changedAt)
  );

  useEffect(() => {
    if (open) {
      setDraftStatus(status);
      setDraftChangedAt(toDateTimeLocalValue(changedAt));
    }
  }, [open, status, changedAt]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label={tCommon("actions.close")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 6l12 12M18 6l-12 12"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <h3 className="text-lg font-semibold text-slate-900">
          {t("statusUpdate.title")}
        </h3>
        <div className="mt-4 space-y-4">
          <Select
            label={t("statusUpdate.statusLabel")}
            value={draftStatus}
            onChange={(event) =>
              setDraftStatus(event.target.value as Job["status"])
            }
            options={[
              { value: "scheduled", label: t("status.scheduled") },
              { value: "in_progress", label: t("status.in_progress") },
              { value: "done", label: t("status.done") },
              { value: "canceled", label: t("status.canceled") }
            ]}
          />
          <Input
            label={t("statusUpdate.changedAtLabel")}
            type="datetime-local"
            value={draftChangedAt}
            onChange={(event) => setDraftChangedAt(event.target.value)}
          />
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {tCommon("actions.cancel")}
          </Button>
          <Button
            type="button"
            onClick={() => onSave(draftStatus, draftChangedAt)}
            disabled={!draftChangedAt}
          >
            {tCommon("actions.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}

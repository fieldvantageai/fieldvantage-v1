"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useClientT } from "@/lib/i18n/useClientT";

type NotesDialogProps = {
  open: boolean;
  value: string;
  onCancel: () => void;
  onSave: (value: string) => void;
};

export default function NotesDialog({
  open,
  value,
  onCancel,
  onSave
}: NotesDialogProps) {
  const { t } = useClientT("jobs");
  const { t: tCommon } = useClientT("common");
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (open) {
      setDraft(value);
    }
  }, [open, value]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">
          {t("notes.title")}
        </h3>
        <div className="mt-4">
          <Textarea
            label={t("notes.label")}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {tCommon("actions.cancel")}
          </Button>
          <Button
            type="button"
            onClick={() => onSave(draft)}
          >
            {tCommon("actions.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}

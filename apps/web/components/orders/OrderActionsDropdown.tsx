"use client";

import { useEffect, useRef, useState } from "react";
import {
  Eye,
  MapPin,
  MoreHorizontal,
  Pencil,
  RefreshCcw,
  X
} from "lucide-react";

import { useClientT } from "@/lib/i18n/useClientT";

type OrderActionsDropdownProps = {
  canEdit: boolean;
  onView: () => void;
  onEdit?: () => void;
  onChangeStatus: () => void;
  onOpenMap?: () => void;
  onCancel?: () => void;
};

export default function OrderActionsDropdown({
  canEdit,
  onView,
  onEdit,
  onChangeStatus,
  onOpenMap,
  onCancel
}: OrderActionsDropdownProps) {
  const { t } = useClientT("jobs");
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-label={t("table.actionsMenu")}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute right-0 top-11 z-20 w-52 rounded-2xl border border-slate-200/70 bg-white/95 p-2 text-sm text-slate-700 shadow-lg">
          <button
            type="button"
            className="flex w-full items-center gap-x-2 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50"
            onClick={(event) => {
              event.stopPropagation();
              setOpen(false);
              onView();
            }}
          >
            <Eye className="h-4 w-4 text-indigo-500" />
            {t("actions.viewHistory")}
          </button>
          {canEdit && onEdit ? (
            <button
              type="button"
              className="flex w-full items-center gap-x-2 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50"
              onClick={(event) => {
                event.stopPropagation();
                setOpen(false);
                onEdit();
              }}
            >
              <Pencil className="h-4 w-4 text-amber-500" />
              {t("actions.edit")}
            </button>
          ) : null}
          <button
            type="button"
            className="flex w-full items-center gap-x-2 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50"
            onClick={(event) => {
              event.stopPropagation();
              setOpen(false);
              onChangeStatus();
            }}
          >
            <RefreshCcw className="h-4 w-4 text-blue-500" />
            {t("actions.changeStatus")}
          </button>
          {onOpenMap ? (
            <button
              type="button"
              className="flex w-full items-center gap-x-2 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50"
              onClick={(event) => {
                event.stopPropagation();
                setOpen(false);
                onOpenMap();
              }}
            >
              <MapPin className="h-4 w-4 text-emerald-500" />
              {t("actions.openMap")}
            </button>
          ) : null}
          {canEdit && onCancel ? (
            <button
              type="button"
              className="flex w-full items-center gap-x-2 rounded-xl px-3 py-2 text-left text-rose-600 transition hover:bg-rose-50/60 hover:text-rose-700"
              onClick={(event) => {
                event.stopPropagation();
                setOpen(false);
                onCancel();
              }}
            >
              <X className="h-4 w-4 text-rose-500" />
              {t("actions.cancel")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

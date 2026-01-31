import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import StatusBadge from "./StatusBadge";
import { useClientT } from "@/lib/i18n/useClientT";
import type { Job } from "@fieldvantage/shared";

export type OrdersTableRow = Job & {
  assigned_label: string;
};

type SortKey = "title" | "customer" | "status" | "startDate";

type OrdersTableProps = {
  orders: OrdersTableRow[];
  locale: string;
  emptyMessage: string;
  isLoading: boolean;
  canEdit: boolean;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (key: SortKey) => void;
  onStatusAction: (job: OrdersTableRow) => void;
  onHistoryAction: (job: OrdersTableRow) => void;
};

export default function OrdersTable({
  orders,
  locale,
  emptyMessage,
  isLoading,
  canEdit,
  sortKey,
  sortDir,
  onSort,
  onStatusAction,
  onHistoryAction
}: OrdersTableProps) {
  const { t } = useClientT("jobs");
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openMenuId) {
      return;
    }
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [openMenuId]);

  if (!isLoading && orders.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200/70 bg-white/95 p-6 text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit"
  });

  const columns: Array<{ key: SortKey; label: string }> = [
    { key: "title", label: t("table.title") },
    { key: "customer", label: t("table.customer") },
    { key: "status", label: t("table.status") },
    { key: "startDate", label: t("table.startDate") }
  ];

  return (
    <div className="relative overflow-visible rounded-3xl border border-slate-200/70 bg-white/95 shadow-sm">
      <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.5fr)] gap-4 border-b border-slate-200/70 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:grid">
        {columns.map((column) => (
          <button
            key={column.key}
            type="button"
            onClick={() => onSort(column.key)}
            className="flex items-center gap-2 text-left transition hover:text-slate-500"
          >
            <span>{column.label}</span>
            {sortKey === column.key ? (
              <span className="text-slate-400">
                {sortDir === "asc" ? "▲" : "▼"}
              </span>
            ) : null}
          </button>
        ))}
        <span>{t("table.actions")}</span>
      </div>
      <div className="divide-y divide-slate-200/70">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.5fr)] sm:items-center"
            >
              {Array.from({ length: 6 }).map((__, colIndex) => (
                <div
                  key={`skeleton-col-${index}-${colIndex}`}
                  className="h-4 w-full animate-pulse rounded-full bg-slate-100"
                />
              ))}
            </div>
          ))
        ) : (
          orders.map((job) => (
            <div
              key={job.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/jobs/${job.id}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  router.push(`/jobs/${job.id}`);
                }
              }}
              className="block px-4 py-4 transition hover:bg-slate-50/70"
            >
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.5fr)] sm:items-center">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {job.title ?? t("table.titleFallback")}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 sm:hidden">
                    {dateFormatter.format(new Date(job.scheduled_for))}
                  </p>
                </div>
                <p className="text-sm text-slate-600">
                  {job.customer_name ?? t("detail.customerFallback")}
                </p>
                <div>
                  <StatusBadge status={job.status} />
                </div>
                <p className="hidden text-sm text-slate-600 sm:block">
                  {dateFormatter.format(new Date(job.scheduled_for))}
                </p>
                <div className="flex items-center justify-end">
                  <div
                    className="relative"
                    ref={job.id === openMenuId ? menuRef : null}
                  >
                    <button
                      type="button"
                      aria-label={t("table.actionsMenu")}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenMenuId((prev) => (prev === job.id ? null : job.id));
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="5" cy="12" r="1.7" fill="currentColor" />
                        <circle cx="12" cy="12" r="1.7" fill="currentColor" />
                        <circle cx="19" cy="12" r="1.7" fill="currentColor" />
                      </svg>
                    </button>
                    {openMenuId === job.id ? (
                      <div className="absolute right-0 top-11 z-20 w-44 rounded-2xl border border-slate-200/70 bg-white/95 p-2 text-sm text-slate-700 shadow-lg">
                        {canEdit ? (
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50"
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenMenuId(null);
                              router.push(`/jobs/${job.id}/edit`);
                            }}
                          >
                            {t("actions.edit")}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50"
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenMenuId(null);
                            onStatusAction(job);
                          }}
                        >
                          {t("actions.changeStatus")}
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50"
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenMenuId(null);
                            onHistoryAction(job);
                          }}
                        >
                          {t("actions.viewHistory")}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

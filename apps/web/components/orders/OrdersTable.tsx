import { useRouter } from "next/navigation";

import StatusBadge from "./StatusBadge";
import { useClientT } from "@/lib/i18n/useClientT";
import type { Job } from "@fieldvantage/shared";

export type OrdersTableRow = Job & {
  assigned_label: string;
};

type SortKey = "title" | "customer" | "assigned" | "status" | "startDate";

type OrdersTableProps = {
  orders: OrdersTableRow[];
  locale: string;
  emptyMessage: string;
  isLoading: boolean;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (key: SortKey) => void;
  onStatusAction: (job: OrdersTableRow) => void;
};

export default function OrdersTable({
  orders,
  locale,
  emptyMessage,
  isLoading,
  sortKey,
  sortDir,
  onSort,
  onStatusAction
}: OrdersTableProps) {
  const { t } = useClientT("jobs");
  const router = useRouter();

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
    { key: "assigned", label: t("table.assigned") },
    { key: "status", label: t("table.status") },
    { key: "startDate", label: t("table.startDate") }
  ];

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/95 shadow-sm">
      <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,0.5fr)] gap-4 border-b border-slate-200/70 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:grid">
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
              className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,0.5fr)] sm:items-center"
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
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,0.5fr)] sm:items-center">
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
                <p className="text-sm text-slate-600">
                  {job.assigned_label || t("table.assignedFallback")}
                </p>
                <div>
                  <StatusBadge status={job.status} />
                </div>
                <p className="hidden text-sm text-slate-600 sm:block">
                  {dateFormatter.format(new Date(job.scheduled_for))}
                </p>
                <div className="flex items-center gap-2 sm:justify-end">
                  <button
                    type="button"
                    title={t("actions.edit")}
                    aria-label={t("actions.edit")}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                    onClick={(event) => {
                      event.stopPropagation();
                      router.push(`/jobs/${job.id}/edit`);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 20h4l11-11-4-4L4 16v4Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="m14 6 4 4"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    title={t("table.quickStatus")}
                    aria-label={t("table.quickStatus")}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                    onClick={(event) => {
                      event.stopPropagation();
                      onStatusAction(job);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 6v6l4 2"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="8"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

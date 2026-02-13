import { useRouter } from "next/navigation";

import OrderActionsDropdown from "./OrderActionsDropdown";
import OrderDateCell from "./OrderDateCell";
import StatusBadge from "./StatusBadge";
import { useClientT } from "@/lib/i18n/useClientT";
import type { Job } from "@fieldvantage/shared";

export type OrdersTableRow = Job & {
  assigned_label: string;
};

type SortKey = "title" | "status" | "startDate";

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
  if (!isLoading && orders.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200/70 bg-white/95 p-6 text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  const columns: Array<{ key: SortKey; label: string }> = [
    { key: "title", label: t("table.title") },
    { key: "status", label: t("table.status") },
    { key: "startDate", label: t("table.startDate") }
  ];

  return (
    <div className="relative overflow-visible rounded-3xl border border-slate-200/70 bg-white/95 shadow-sm">
      <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_minmax(0,0.4fr)] gap-4 border-b border-slate-200/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:grid">
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
        <span className="text-right">{t("table.actions")}</span>
      </div>
      <div className="divide-y divide-slate-200/70">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_minmax(0,0.4fr)] sm:items-center"
            >
              {Array.from({ length: 5 }).map((__, colIndex) => (
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
              <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_minmax(0,0.4fr)] sm:items-center">
                <div className="flex items-center gap-x-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 bg-slate-100 text-xs font-semibold text-slate-600">
                    {(job.customer_name ?? t("detail.customerFallback"))
                      .trim()
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {job.title ?? t("table.titleFallback")}
                    </p>
                    <p className="truncate text-sm text-slate-500">
                      {job.customer_name ?? t("detail.customerFallback")}
                    </p>
                    <div className="mt-2 sm:hidden">
                      <OrderDateCell
                        value={job.scheduled_for}
                        locale={locale}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-start sm:justify-center">
                  <StatusBadge status={job.status} />
                </div>
                <OrderDateCell
                  value={job.scheduled_for}
                  locale={locale}
                  className="hidden sm:block"
                />
                <div className="flex items-center justify-end">
                  <OrderActionsDropdown
                    canEdit={canEdit}
                    onView={() => router.push(`/jobs/${job.id}`)}
                    onEdit={
                      canEdit
                        ? () => router.push(`/jobs/${job.id}/edit`)
                        : undefined
                    }
                    onChangeStatus={() => onStatusAction(job)}
                    onOpenMap={() => router.push(`/jobs/${job.id}`)}
                    onCancel={() => onStatusAction(job)}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

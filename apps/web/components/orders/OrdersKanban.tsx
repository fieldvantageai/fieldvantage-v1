"use client";

import { Inbox } from "lucide-react";

import OrderActionsDropdown from "./OrderActionsDropdown";
import OrderDateCell from "./OrderDateCell";
import StatusBadge from "./StatusBadge";
import type { Job } from "@fieldvantage/shared";
import { useClientT } from "@/lib/i18n/useClientT";

type OrdersKanbanProps = {
  orders: Array<Job & { assigned_label: string }>;
  locale: string;
  isLoading: boolean;
  canEdit: boolean;
  onView: (job: Job) => void;
  onEdit: (job: Job) => void;
  onChangeStatus: (job: Job) => void;
  onOpenMap: (job: Job) => void;
  onCancel: (job: Job) => void;
};

type StatusColumn = {
  id: Job["status"];
  tone: string;
  indicator: string;
  border: string;
};

const statusColumns: StatusColumn[] = [
  {
    id: "scheduled",
    tone: "bg-slate-100/60",
    indicator: "bg-blue-500",
    border: "border-l-blue-500"
  },
  {
    id: "in_progress",
    tone: "bg-slate-100/60",
    indicator: "bg-amber-500",
    border: "border-l-amber-500"
  },
  {
    id: "done",
    tone: "bg-slate-100/60",
    indicator: "bg-emerald-500",
    border: "border-l-emerald-500"
  },
  {
    id: "canceled",
    tone: "bg-slate-100/60",
    indicator: "bg-rose-500",
    border: "border-l-rose-500"
  }
];

export default function OrdersKanbanView({
  orders,
  locale,
  isLoading,
  canEdit,
  onView,
  onEdit,
  onChangeStatus,
  onOpenMap,
  onCancel
}: OrdersKanbanProps) {
  const { t } = useClientT("jobs");
  const grouped = statusColumns.map((column) => ({
    ...column,
    label: t(`status.${column.id}`),
    items: orders.filter((job) => job.status === column.id)
  }));

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible">
        {statusColumns.map((column) => (
          <div
            key={column.id}
            className="min-w-[280px] snap-start rounded-xl border border-slate-200/70 bg-white/95 p-4 shadow-sm lg:min-w-0"
          >
            <div className="h-5 w-36 animate-pulse rounded-full bg-slate-100" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`${column.id}-skeleton-${index}`}
                  className="h-24 w-full animate-pulse rounded-lg bg-slate-100"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory lg:grid lg:grid-cols-4 lg:overflow-visible">
      {grouped.map((column) => (
        <KanbanColumn
          key={column.id}
          title={column.label}
          indicator={column.indicator}
          tone={column.tone}
          count={column.items.length}
        >
          {column.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200/70 bg-white/90 px-4 py-6 text-center text-sm text-slate-400">
              <Inbox className="h-4 w-4 text-slate-300" />
              {t("filters.empty")}
            </div>
          ) : (
            column.items.map((job) => (
              <OrderCard
                key={job.id}
                job={job}
                locale={locale}
                canEdit={canEdit}
                borderTone={column.border}
                onView={() => onView(job)}
                onEdit={() => onEdit(job)}
                onChangeStatus={() => onChangeStatus(job)}
                onOpenMap={() => onOpenMap(job)}
                onCancel={() => onCancel(job)}
              />
            ))
          )}
        </KanbanColumn>
      ))}
    </div>
  );
}

type KanbanColumnProps = {
  title: string;
  indicator: string;
  tone: string;
  count: number;
  children: React.ReactNode;
};

function KanbanColumn({
  title,
  indicator,
  tone,
  count,
  children
}: KanbanColumnProps) {
  return (
    <div
      className={`min-w-[280px] snap-start rounded-xl border border-slate-200/70 p-4 shadow-sm ${tone} flex flex-col gap-4 lg:min-w-[300px]`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-2 text-base font-semibold text-slate-700">
          <span className={`h-2 w-2 rounded-full ${indicator}`} />
          {title}
        </div>
        <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-slate-500">
          {count}
        </span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

type OrderCardProps = {
  job: Job & { assigned_label: string };
  locale: string;
  canEdit: boolean;
  borderTone: string;
  onView: () => void;
  onEdit: () => void;
  onChangeStatus: () => void;
  onOpenMap: () => void;
  onCancel: () => void;
};

function OrderCard({
  job,
  locale,
  canEdit,
  borderTone,
  onView,
  onEdit,
  onChangeStatus,
  onOpenMap,
  onCancel
}: OrderCardProps) {
  const { t } = useClientT("jobs");
  return (
    <div
      className={`rounded-lg border border-transparent border-l-4 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-200/70 hover:shadow-md ${borderTone} transition-opacity transition-transform`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            {job.title ?? t("table.titleFallback")}
          </p>
          <p className="truncate text-sm text-slate-500">
            {job.customer_name ?? t("detail.customerFallback")}
          </p>
          <StatusBadge status={job.status} />
        </div>
        <OrderActionsDropdown
          canEdit={canEdit}
          onView={onView}
          onEdit={onEdit}
          onChangeStatus={onChangeStatus}
          onOpenMap={onOpenMap}
          onCancel={onCancel}
        />
      </div>
      <div className="mt-3">
        <OrderDateCell value={job.scheduled_for} locale={locale} />
      </div>
    </div>
  );
}

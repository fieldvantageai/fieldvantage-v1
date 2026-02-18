"use client";

import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Inbox } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import OrderActionsDropdown from "./OrderActionsDropdown";
import OrderDateCell from "./OrderDateCell";
import StatusBadge from "./StatusBadge";
import { ToastBanner } from "@/components/ui/Toast";
import type { Job } from "@fieldvantage/shared";
import { useClientT } from "@/lib/i18n/useClientT";

type OrdersKanbanProps = {
  orders: Array<Job & { assigned_label: string }>;
  locale: string;
  isLoading: boolean;
  canEdit: boolean;
  onPersistStatus: (
    orderId: string,
    status: Job["status"],
    changedAt: string,
    note?: string | null
  ) => Promise<void>;
  onView: (job: Job & { assigned_label: string }) => void;
  onEdit: (job: Job & { assigned_label: string }) => void;
  onChangeStatus: (job: Job & { assigned_label: string }) => void;
  onOpenMap: (job: Job & { assigned_label: string }) => void;
  onCancel: (job: Job & { assigned_label: string }) => void;
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

type OrdersByStatus = Record<Job["status"], Array<Job & { assigned_label: string }>>;

const statusOrder: Job["status"][] = [
  "scheduled",
  "in_progress",
  "done",
  "canceled"
];

const DEBUG_DND = true;

const groupOrdersByStatus = (orders: Array<Job & { assigned_label: string }>) =>
  statusOrder.reduce((acc, status) => {
    acc[status] = orders.filter((job) => job.status === status);
    return acc;
  }, {} as OrdersByStatus);

const cloneOrdersByStatus = (source: OrdersByStatus) =>
  statusOrder.reduce((acc, status) => {
    acc[status] = source[status].map((order) => ({ ...order }));
    return acc;
  }, {} as OrdersByStatus);

const moveOrderBetweenStatuses = (
  current: OrdersByStatus,
  orderId: string,
  toStatus: Job["status"]
) => {
  let moved: (Job & { assigned_label: string }) | null = null;
  const next = statusOrder.reduce((acc, status) => {
    acc[status] = current[status].filter((order) => {
      if (order.id === orderId) {
        moved = { ...order, status: toStatus };
        return false;
      }
      return true;
    });
    return acc;
  }, {} as OrdersByStatus);
  if (moved) {
    next[toStatus] = [...next[toStatus], moved];
  }
  return next;
};

const findOrderStatus = (current: OrdersByStatus, orderId: string) => {
  for (const status of statusOrder) {
    if (current[status].some((order) => order.id === orderId)) {
      return status;
    }
  }
  return null;
};

const canMove = (
  fromStatus: Job["status"],
  toStatus: Job["status"],
  canEdit: boolean
) => {
  if (fromStatus === toStatus) {
    return true;
  }
  if (fromStatus === "canceled" && toStatus !== "canceled") {
    return canEdit;
  }
  if (toStatus === "canceled") {
    return canEdit;
  }
  return true;
};

export default function OrdersKanbanView({
  orders,
  locale,
  isLoading,
  canEdit,
  onPersistStatus,
  onView,
  onEdit,
  onChangeStatus,
  onOpenMap,
  onCancel
}: OrdersKanbanProps) {
  const { t } = useClientT("jobs");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );
  const [ordersByStatus, setOrdersByStatus] = useState<OrdersByStatus>(() =>
    groupOrdersByStatus(orders)
  );
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingCancel, setPendingCancel] = useState<{
    orderId: string;
    fromStatus: Job["status"];
    toStatus: Job["status"];
  } | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error" | "info";
  } | null>(null);
  const snapshotRef = useRef<OrdersByStatus | null>(null);

  useEffect(() => {
    if (isDragging || isSaving || pendingCancel) {
      return;
    }
    setOrdersByStatus(groupOrdersByStatus(orders));
  }, [orders, isDragging, isSaving, pendingCancel]);

  const grouped = useMemo(
    () =>
      statusColumns.map((column) => ({
        ...column,
        label: t(`status.${column.id}`),
        items: ordersByStatus[column.id] ?? []
      })),
    [ordersByStatus, t]
  );
  const activeOrder = activeOrderId
    ? statusOrder
        .flatMap((status) => ordersByStatus[status])
        .find((order) => order.id === activeOrderId) ?? null
    : null;

  const rollback = () => {
    if (snapshotRef.current) {
      setOrdersByStatus(snapshotRef.current);
    }
  };

  const getOverContainerId = (over: DragOverEvent["over"] | DragEndEvent["over"]) => {
    if (!over) {
      return null;
    }
    const sortableContainerId = over.data?.current?.sortable?.containerId;
    if (sortableContainerId && statusOrder.includes(sortableContainerId)) {
      return sortableContainerId as Job["status"];
    }
    if (typeof over.id === "string" && statusOrder.includes(over.id as Job["status"])) {
      return over.id as Job["status"];
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (typeof event.active.id !== "string") {
      return;
    }
    snapshotRef.current = cloneOrdersByStatus(ordersByStatus);
    setActiveOrderId(event.active.id);
    setIsDragging(true);
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!activeOrderId) {
      return;
    }
    const fromStatus = findOrderStatus(ordersByStatus, activeOrderId);
    if (!fromStatus) {
      return;
    }
    const toStatus = getOverContainerId(event.over);
    if (!toStatus || toStatus === fromStatus) {
      return;
    }
    setOrdersByStatus((current) =>
      moveOrderBetweenStatuses(current, activeOrderId, toStatus)
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setIsDragging(false);
    if (!activeOrderId) {
      return;
    }
    const fromStatus = snapshotRef.current
      ? findOrderStatus(snapshotRef.current, activeOrderId)
      : null;
    const toStatus = getOverContainerId(event.over);
    if (DEBUG_DND) {
      console.log("[DND] dragEnd", {
        orderId: activeOrderId,
        fromStatus,
        toStatus
      });
    }

    if (!fromStatus || !toStatus || fromStatus === toStatus) {
      if (DEBUG_DND) {
        console.warn("[DND] invalid drop target", {
          orderId: activeOrderId,
          fromStatus,
          toStatus
        });
      }
      rollback();
      if (!toStatus) {
        console.error("[DND] drop target not resolved", {
          orderId: activeOrderId,
          fromStatus
        });
        setToast({ message: t("kanban.updateError"), variant: "error" });
      }
      setActiveOrderId(null);
      return;
    }

    if (!canMove(fromStatus, toStatus, canEdit)) {
      rollback();
      setToast({ message: t("kanban.permissionError"), variant: "error" });
      if (DEBUG_DND) {
        console.log("[DND] permission blocked", {
          orderId: activeOrderId,
          fromStatus,
          toStatus
        });
      }
      setActiveOrderId(null);
      return;
    }

    if (toStatus === "canceled") {
      setPendingCancel({ orderId: activeOrderId, fromStatus, toStatus });
      setActiveOrderId(null);
      return;
    }

    setIsSaving(true);
    try {
      if (DEBUG_DND) {
        console.log("[DND] persist", {
          orderId: activeOrderId,
          fromStatus,
          toStatus,
          dbStatus: toStatus
        });
      }
      await onPersistStatus(activeOrderId, toStatus, new Date().toISOString(), null);
      if (DEBUG_DND) {
        console.log("[DND] persist success", { orderId: activeOrderId });
      }
    } catch (error) {
      rollback();
      console.error(error);
      setToast({
        message: error instanceof Error ? error.message : t("kanban.updateError"),
        variant: "error"
      });
      if (DEBUG_DND) {
        console.log("[DND] persist error", { orderId: activeOrderId, error });
      }
    } finally {
      setIsSaving(false);
      setActiveOrderId(null);
    }
  };

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
    <div className="space-y-3">
      {toast ? (
        <ToastBanner
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      ) : null}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory lg:grid lg:grid-cols-4 lg:overflow-visible">
          {grouped.map((column) => (
            <KanbanColumn
              key={column.id}
              status={column.id}
              title={column.label}
              indicator={column.indicator}
              tone={column.tone}
              count={column.items.length}
            >
              <SortableContext
                id={column.id}
                items={column.items.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
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
              </SortableContext>
            </KanbanColumn>
          ))}
        </div>
        <DragOverlay>
          {activeOrder ? (
            <div className="rounded-lg border border-slate-200/70 bg-white p-4 shadow-lg ring-2 ring-brand-200/60">
              <p className="text-sm font-semibold text-slate-900">
                {activeOrder.title ?? t("table.titleFallback")}
              </p>
              <p className="text-sm text-slate-500">
                {activeOrder.customer_name ?? t("detail.customerFallback")}
              </p>
              <div className="mt-2">
                <StatusBadge status={activeOrder.status} />
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      {pendingCancel ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => {
            rollback();
            setPendingCancel(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-900">
              {t("kanban.cancelTitle")}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {t("kanban.cancelMessage")}
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200/70 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                onClick={() => {
                  rollback();
                  setPendingCancel(null);
                }}
              >
                {t("kanban.cancelDismiss")}
              </button>
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700"
                onClick={async () => {
                  if (!pendingCancel) {
                    return;
                  }
                  setIsSaving(true);
                  try {
                    if (DEBUG_DND) {
                      console.log("[DND] cancel confirm", {
                        orderId: pendingCancel.orderId,
                        fromStatus: pendingCancel.fromStatus,
                        toStatus: pendingCancel.toStatus,
                        dbStatus: pendingCancel.toStatus
                      });
                    }
                    await onPersistStatus(
                      pendingCancel.orderId,
                      pendingCancel.toStatus,
                      new Date().toISOString(),
                      null
                    );
                  } catch (error) {
                    rollback();
                    console.error(error);
                    setToast({
                      message:
                        error instanceof Error
                          ? error.message
                          : t("kanban.updateError"),
                      variant: "error"
                    });
                    if (DEBUG_DND) {
                      console.log("[DND] cancel persist error", {
                        orderId: pendingCancel.orderId,
                        error
                      });
                    }
                  } finally {
                    setIsSaving(false);
                    setPendingCancel(null);
                  }
                }}
                disabled={isSaving}
              >
                {t("kanban.cancelConfirm")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type KanbanColumnProps = {
  status: Job["status"];
  title: string;
  indicator: string;
  tone: string;
  count: number;
  children: ReactNode;
};

function KanbanColumn({
  status,
  title,
  indicator,
  tone,
  count,
  children
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={`min-w-[280px] snap-start rounded-xl border border-slate-200/70 p-4 shadow-sm ${tone} flex flex-col gap-4 lg:min-w-[300px] ${
        isOver ? "ring-2 ring-brand-200 bg-slate-100/70" : ""
      }`}
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
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: job.id, data: { status: job.status } });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border border-transparent border-l-4 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-200/70 hover:shadow-md ${borderTone} transition-opacity transition-transform ${
        isDragging ? "opacity-80 shadow-lg ring-2 ring-brand-200/60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          ref={setActivatorNodeRef}
          className="min-w-0 space-y-1 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
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
